import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  context: { params: { marketId: string } }
) {
  // Properly await and destructure the marketId
  const { marketId } = await Promise.resolve(context.params);

  try {
    // Get market data
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select(`
        id,
        title,
        description,
        probability_yes,
        probability_no,
        total_volume,
        total_yes_amount,
        total_no_amount,
        closing_date,
        status,
        min_amount,
        max_amount,
        resolved_value,
        trades,
        views
      `)
      .eq('id', marketId)
      .single();

    console.log('Raw market data:', market);
    console.log('Market error:', marketError);

    if (marketError) {
      console.error('Database error:', marketError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error',
          details: marketError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!market) {
      return new NextResponse(
        JSON.stringify({ error: 'Market not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate probabilities exist and are numbers
    if (typeof market.probability_yes !== 'number' || isNaN(market.probability_yes) ||
        typeof market.probability_no !== 'number' || isNaN(market.probability_no)) {
      console.error('Invalid probabilities:', {
        probability_yes: market.probability_yes,
        probability_no: market.probability_no
      });
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid market probabilities',
          details: { 
            probability_yes: market.probability_yes,
            probability_no: market.probability_no 
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform the data to match the frontend interface
    const transformedMarket = {
      ...market,
      probability: market.probability_yes, // Use yes probability as the main probability
      volume: market.total_volume // Map total_volume to volume for frontend compatibility
    };

    console.log('Transformed market data:', transformedMarket);

    return new NextResponse(JSON.stringify(transformedMarket), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
