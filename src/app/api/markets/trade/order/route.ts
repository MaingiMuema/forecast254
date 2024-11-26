/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CreateOrderRequest } from '@/types/order';
import { matchOrder as processOrderMatching } from '@/lib/orderMatching';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body: CreateOrderRequest = await request.json();
    console.log('Received order request:', {
      ...body,
      price_type: typeof body.price,
      price_value: body.price,
      market_price: body.market_price,
      calculated_price: body.calculated_price
    });

    // Initialize Supabase client with awaited cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user's balance
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user balance:', profileError);
      return NextResponse.json(
        { error: 'Could not fetch user profile' },
        { status: 500 }
      );
    }

    // Calculate required funds - only for buy orders
    const requiredFunds = body.side === 'buy' ? Number(body.price) * Number(body.amount) : 0;

    // Only check balance for buy orders
    if (body.side === 'buy' && userProfile.balance < requiredFunds) {
      return NextResponse.json(
        { 
          error: 'Insufficient funds', 
          balance: userProfile.balance,
          required: requiredFunds,
          details: {
            price: body.price,
            amount: body.amount,
            calculation: `${body.price} * ${body.amount} = ${requiredFunds}`
          }
        },
        { status: 400 }
      );
    }

    console.log('Processing order:', {
      amount: body.amount,
      market_id: body.market_id,
      position: body.position,
      price: body.price,
      required_funds: requiredFunds,
      side: body.side,
      user_id: session.user.id
    });

    const { data: result, error: transactionError } = await supabase
      .rpc('create_order_with_balance_update', {
        p_amount: Number(body.amount),
        p_market_id: body.market_id,
        p_position: body.position,
        p_price: Number(body.price),
        p_required_funds: requiredFunds,
        p_side: body.side,
        p_user_id: session.user.id
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: `Transaction error: ${transactionError.message}` },
        { status: 500 }
      );
    }

    console.log('Order processed successfully:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Unexpected error in order processing:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
