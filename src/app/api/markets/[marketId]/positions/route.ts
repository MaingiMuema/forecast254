/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteHandlerContext {
  params: {
    marketId: string;
  };
}

export async function GET(
  _: Request,
  { params }: RouteHandlerContext
) {
  try {
    const { marketId } = params;

    // Create a Supabase client using the auth helpers
    const supabase = createRouteHandlerClient({ cookies });

    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return Response.json(
        { error: 'Authentication failed', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return Response.json(
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
      return Response.json(
        { 
          error: 'Failed to fetch positions',
          details: positionsError
        },
        { status: 500 }
      );
    }

    return Response.json(positions || []);
  } catch (error) {
    console.error('Error in positions endpoint:', error);
    return Response.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
