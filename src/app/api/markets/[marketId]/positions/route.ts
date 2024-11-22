/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Create a Supabase client with the service role key for admin access

export async function GET(request: NextRequest) {
  try {
    // Get marketId from URL pattern
    const pathname = request.nextUrl.pathname;
    const marketId = pathname.split('/')[3]; // /api/markets/[marketId]/positions

    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    // Create a Supabase client using the auth helpers
    const supabase = createRouteHandlerClient({ cookies });

    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
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
      return NextResponse.json(
        { 
          error: 'Failed to fetch positions',
          details: positionsError
        },
        { status: 500 }
      );
    }

    return NextResponse.json(positions || []);
  } catch (error) {
    console.error('Error in positions endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
