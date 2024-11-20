/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Await the params before accessing
    const { id } = await Promise.resolve(params);
    const marketId = id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!marketId || !uuidRegex.test(marketId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid market ID format' }),
        { status: 400 }
      );
    }

    // Fetch market details
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select(`
        id,
        question,
        description,
        category,
        created_at,
        end_date,
        status,
        creator_id,
        resolved_value
      `)
      .eq('id', marketId)
      .single();

    if (marketError) throw marketError;
    if (!market) {
      return new Response(
        JSON.stringify({ error: 'Market not found' }),
        { status: 404 }
      );
    }

    // Fetch market stats from transactions
    const { data: stats, error: statsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('market_id', marketId);

    if (statsError) throw statsError;

    // Calculate market stats
    const totalTrades = stats?.length || 0;
    const totalVolume = stats?.reduce((sum, trade) => sum + (trade.total || 0), 0) || 0;
    const uniqueTraders = new Set(stats?.map(trade => trade.user_id)).size;

    // Transform and combine the data
    const marketData = {
      ...market,
      stats: {
        total_trades: totalTrades,
        total_volume: totalVolume,
        unique_traders: uniqueTraders
      }
    };

    return new Response(JSON.stringify(marketData));
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch market details' }),
      { status: 500 }
    );
  }
}
