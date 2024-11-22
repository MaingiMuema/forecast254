/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  try {
    const { marketId } = params;

    // Create a Supabase client using the auth helpers
    const supabase = createRouteHandlerClient({ cookies });

    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return new NextResponse(
        JSON.stringify({ error: 'Authentication failed', details: sessionError.message }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'No active session found' }), 
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's positions for this market
    const { data: positions, error: positionsError } = await supabase
      .from('market_positions')
      .select(`
        id,
        user_id,
        market_id,
        position,
        amount,
        shares,
        created_at
      `)
      .eq('market_id', marketId)
      .eq('user_id', session.user.id);

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch positions',
          details: positionsError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify(positions || []),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in positions endpoint:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
