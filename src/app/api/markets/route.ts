import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('markets')
      .select('*')
      .eq('status', 'open')
      .gt('closing_date', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()) // Filter markets closing after 2 days
      .limit(limit);

    // Apply category filter if not 'all'
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // Add specific filters based on type
    switch (type) {
      case 'top':
        // Order by trading volume
        query = query.order('total_volume', { ascending: false });
        break;
      case 'trending':
        // Order by trending_score which combines views and trades
        query = query.order('trending_score', { ascending: false });
        break;
      case 'activity':
        // Get most recently updated markets
        query = query.order('updated_at', { ascending: false });
        break;
      default:
        // Default to ordering by created_at
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: markets, error } = await query;

    if (error) {
      throw error;
    }

    // Get all filled orders for the markets
    const marketIds = markets.map(m => m.id);
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('market_id, filled_amount, price')
      .in('market_id', marketIds)
      .eq('status', 'filled');

    if (ordersError) {
      throw ordersError;
    }

    // Calculate volumes for each market
    const marketVolumes = orders.reduce((acc: { [key: string]: number }, order) => {
      const volume = (order.filled_amount || 0) * (order.price || 0);
      acc[order.market_id] = (acc[order.market_id] || 0) + volume;
      return acc;
    }, {});

    // Transform the data to match the component expectations
    const transformedMarkets = markets.map(market => ({
      id: market.id,
      title: market.title,
      category: market.category,
      volume: marketVolumes[market.id] ? `KES ${Math.round(marketVolumes[market.id]).toLocaleString()}` : "KES 0",
      probability: Math.round(market.probability_yes * 100),
      endDate: market.end_date,
      isHot: market.trending_score > 100 || market.total_volume > 10000,
      description: market.description
    }));

    return NextResponse.json(transformedMarkets);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
