import { Suspense } from 'react';
import MarketHeader from '@/components/Markets/MarketHeader';
import MarketDescription from '@/components/Markets/MarketDescription';
import MarketActivity from '@/components/Markets/MarketActivity';
import MarketTradingPanel from '@/components/Markets/MarketTradingPanel';
import MarketStats from '@/components/Markets/MarketStats';
import MarketSkeleton from '@/components/Markets/MarketSkeleton';
import MarketViewTracker from '@/components/Markets/MarketViewTracker';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MarketPage({ params }: PageProps) {
  const resolvedParams = await params;
  const marketId = resolvedParams.id;

  return (
    <main className="min-h-screen bg-background">
      {/* View Tracker */}
      <MarketViewTracker marketId={marketId} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Panel - Shows first on mobile */}
          <div className="lg:col-span-1 order-first lg:order-last space-y-6">
            <Suspense fallback={<div className="h-[400px] animate-pulse bg-gray-800 rounded-lg" />}>
              <MarketTradingPanel marketId={marketId} />
              <MarketStats marketId={marketId} />
            </Suspense>
          </div>

          {/* Market Details - Shows second on mobile */}
          <div className="lg:col-span-2 order-last lg:order-first space-y-6">
            <Suspense fallback={<MarketSkeleton />}>
              <MarketHeader marketId={marketId} />
              <MarketDescription marketId={marketId} />
              <MarketActivity marketId={marketId} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
