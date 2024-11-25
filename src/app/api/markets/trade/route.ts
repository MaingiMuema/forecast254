/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
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

    const { marketId, amount, position } = await request.json();

    if (!marketId || !amount || !position) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get market data using admin client
    const { data: market, error: marketError } = await supabaseAdmin
      .from('markets')
      .select(`
        id,
        title,
        status,
        closing_date,
        min_amount,
        max_amount,
        probability_yes,
        probability_no,
        total_yes_amount,
        total_no_amount,
        resolved_value,
        total_volume,
        trades
      `)
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      console.error('Market error:', marketError);
      return new NextResponse(
        JSON.stringify({ error: 'Market not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Market data:', {
      id: market.id,
      probability_yes: market.probability_yes,
      probability_no: market.probability_no,
      status: market.status,
      closing_date: market.closing_date
    });

    // Validate market has valid probabilities
    if (typeof market.probability_yes !== 'number' || isNaN(market.probability_yes) ||
        typeof market.probability_no !== 'number' || isNaN(market.probability_no)) {
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

    // Validate market is open
    if (market.status !== 'open' || new Date(market.closing_date) <= new Date()) {
      return new NextResponse(
        JSON.stringify({ error: 'Market is closed' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate amount
    if (amount < market.min_amount || amount > market.max_amount) {
      return new NextResponse(
        JSON.stringify({ 
          error: `Amount must be between ${market.min_amount} and ${market.max_amount}` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate probability based on position
    const probability = position === 'yes' ? market.probability_yes : market.probability_no;

    console.log('Probability calculation:', {
      probability_yes: market.probability_yes,
      probability_no: market.probability_no,
      position,
      calculatedProbability: probability
    });

    // Handle initial market state (when no trades have occurred)
    if (market.total_volume === 0) {
      // Set initial probability to 0.5 for first trade
      const initialProbability = 0.5;
      console.log('Using initial probability for first trade:', initialProbability);
      
      // Calculate shares using initial probability
      const shares = Number((Number(amount) / initialProbability).toFixed(4));
      console.log('Initial shares calculation:', {
        amount: Number(amount),
        initialProbability,
        shares
      });

      // Start transaction
      const { error: tradeError } = await supabaseAdmin.rpc('execute_trade', {
        p_market_id: marketId,
        p_user_id: session.user.id,
        p_position: position,
        p_amount: amount,
        p_shares: shares
      });

      if (tradeError) {
        console.error('Trade execution error:', tradeError);
        return new NextResponse(
          JSON.stringify({ error: 'Failed to execute trade', details: tradeError.message }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new NextResponse(
        JSON.stringify({ success: true, shares }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For markets with existing trades, validate probability
    if (probability <= 0 || probability >= 1) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Cannot trade on this position at this time',
          details: { 
            probability_yes: market.probability_yes,
            probability_no: market.probability_no,
            position,
            calculatedProbability: probability 
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const shares = Number((Number(amount) / probability).toFixed(4));
    
    console.log('Shares calculation:', {
      amount: Number(amount),
      probability,
      calculation: `${amount} / ${probability}`,
      shares
    });

    // Get user's profile and balance using admin client
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unable to fetch profile. Please try signing out and back in.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile) {
      // Create a profile if it doesn't exist
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(session.user.id);
      
      if (userError || !userData?.user) {
        console.error('User fetch error:', userError);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Unable to fetch user data. Please try signing out and back in.' 
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([
          { 
            id: session.user.id,
            username: userData.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
            email: userData.user.email!,
            balance: 1000.0
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Create profile error:', createError);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to create profile. Please contact support if this persists.' 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      profile = newProfile;
    }

    if (profile.balance < Number(amount)) {
      return new NextResponse(
        JSON.stringify({ 
          error: `Insufficient balance. You have ${profile.balance.toFixed(2)} available.` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Executing trade:', {
      marketId,
      userId: session.user.id,
      position,
      amount: Number(amount),
      shares,
      probability
    });

    // Execute trade using database function
    const { data: trade, error: tradeError } = await supabaseAdmin.rpc(
      'execute_trade',
      {
        p_market_id: marketId,
        p_user_id: session.user.id,
        p_position: position,
        p_amount: amount,
        p_shares: shares
      }
    );

    if (tradeError) {
      console.error('Trade error:', tradeError);
      return new NextResponse(
        JSON.stringify({ 
          error: tradeError.message || 'Failed to execute trade',
          details: tradeError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Trade error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to execute trade' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
