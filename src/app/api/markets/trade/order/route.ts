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

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    if (!session) {
      return NextResponse.json(
        { error: 'Please login to continue' },
        { status: 401 }
      );
    }

    // Get user's balance
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user balance:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify account balance' },
        { status: 500 }
      );
    }

    // Calculate required funds - only for buy orders
    const orderPrice = body.order_type === 'market' 
      ? (body.market_price || body.calculated_price)
      : body.price;

    const requiredFunds = body.side === 'buy' ? Number(orderPrice) * Number(body.amount) : 0;

    // Only check balance for buy orders
    if (body.side === 'buy' && userProfile.balance < requiredFunds) {
      return NextResponse.json(
        { 
          error: 'Insufficient funds', 
          balance: userProfile.balance,
          required: requiredFunds,
          details: {
            price: orderPrice,
            amount: body.amount,
            calculation: `${orderPrice} * ${body.amount} = ${requiredFunds}`
          }
        },
        { status: 400 }
      );
    }

    // Start a transaction to ensure atomicity
    console.log('Processing order with price:', {
      original_price: body.price,
      market_price: body.market_price,
      calculated_price: body.calculated_price,
      final_price: orderPrice,
      order_type: body.order_type,
      side: body.side,
      required_funds: requiredFunds
    });

    const { data: result, error: transactionError } = await supabase
      .rpc('create_order_with_balance_update', {
        p_market_id: body.market_id,
        p_user_id: session.user.id,
        p_order_type: body.order_type,
        p_side: body.side,
        p_position: body.position,
        p_price: orderPrice, // Convert to number to ensure no null values
        p_amount: Number(body.amount),
        p_required_funds: requiredFunds
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: transactionError.message || 'Failed to process order' },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const { order, profile: updatedProfile, market: updatedMarket } = result;

    console.log('Order created successfully:', order);
    console.log('Balance updated successfully:', updatedProfile);
    console.log('Market updated successfully:', updatedMarket);

    // Order matching is now handled automatically by database trigger
    // Get the final order state after matching
    const { data: finalOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single();

    // Get the final market state after matching
    const { data: finalMarket } = await supabase
      .from('markets')
      .select('trades, probability_yes, probability_no, last_trade_price, last_trade_time')
      .eq('id', order.market_id)
      .single();

    return NextResponse.json({
      order: finalOrder || order,
      balance: updatedProfile.balance,
      market: finalMarket || {
        trades: updatedMarket.trades,
        probability_yes: updatedMarket.probability_yes,
        probability_no: updatedMarket.probability_no,
        last_trade_price: updatedMarket.last_trade_price,
        last_trade_time: updatedMarket.last_trade_time
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in order processing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
