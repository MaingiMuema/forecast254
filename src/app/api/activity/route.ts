import { NextResponse } from 'next/server';

// Mock data for demonstration
const mockActivities = [
  {
    id: '1',
    type: 'new_trade',
    marketId: 'market-1',
    marketTitle: 'Will Kenya win AFCON 2024?',
    description: 'Predict whether Kenya national football team will emerge victorious in the upcoming African Cup of Nations 2024.',
    category: 'Sports',
    endDate: '2024-02-11',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'buy',
    amount: 5000,
    price: 0.75,
    marketId: 'market-2',
    marketTitle: 'Will Nairobi experience heavy rainfall in March 2024?',
    trader: '0x1234567890abcdef',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '3',
    type: 'add_liquidity',
    amount: 10000,
    marketId: 'market-1',
    marketTitle: 'Will Kenya win AFCON 2024?',
    trader: '0xabcdef1234567890',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
  },
  {
    id: '4',
    type: 'new_trade',
    marketId: 'market-3',
    marketTitle: 'Will the Central Bank of Kenya lower interest rates in Q2 2024?',
    description: 'Predict whether CBK will reduce the base lending rate in the second quarter of 2024.',
    category: 'Economics',
    endDate: '2024-06-30',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
  },
  {
    id: '5',
    type: 'sell',
    amount: 2500,
    price: 0.65,
    marketId: 'market-2',
    marketTitle: 'Will Nairobi experience heavy rainfall in March 2024?',
    trader: '0x9876543210fedcba',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeline = searchParams.get('timeline') || '24h';
  const type = searchParams.get('type') || 'all';

  // Get the cutoff time based on the timeline
  const now = Date.now();
  const cutoffTime = new Date(
    now -
    (timeline === '7d'
      ? 7 * 24 * 60 * 60 * 1000
      : timeline === '30d'
      ? 30 * 24 * 60 * 60 * 1000
      : timeline === 'all'
      ? Number.MAX_SAFE_INTEGER
      : 24 * 60 * 60 * 1000)
  );

  // Filter activities based on timeline and type
  let filteredActivities = mockActivities.filter(
    (activity) => new Date(activity.timestamp) > cutoffTime
  );

  // Filter by type if not 'all'
  if (type !== 'all') {
    if (type === 'trades') {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === 'buy' || activity.type === 'sell'
      );
    } else if (type === 'liquidity') {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === 'add_liquidity' || activity.type === 'remove_liquidity'
      );
    } else if (type === 'resolutions') {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === 'resolution'
      );
    } else if (type === 'recent') {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === 'new_trade'
      );
    }
  }

  // Sort activities by timestamp (most recent first)
  filteredActivities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return NextResponse.json({ activities: filteredActivities });
}
