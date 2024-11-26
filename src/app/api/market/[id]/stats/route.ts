import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get marketId from URL
    const marketId = request.url.split('/market/')[1].split('/stats')[0];

    // Fetch market statistics
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_market_statistics', {
        market_id_param: marketId
      });

    if (statsError) throw statsError;

    if (!statsData) {
      // If no stats found, return default values
      return NextResponse.json({
        total_trades: 0,
        total_volume: 0,
        unique_traders: 0,
        probability_yes: 0.5,
        probability_no: 0.5,
      });
    }

    return NextResponse.json(statsData);
  } catch (error) {
    console.error('Error fetching market statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market statistics' },
      { status: 500 }
    );
  }
}
