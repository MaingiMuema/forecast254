/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { marketId, outcome } = await request.json();
    console.log('Resolving market:', { marketId, outcome });

    // Validate input
    if (!marketId || outcome === undefined || outcome === null) {
      return NextResponse.json(
        { error: 'Market ID and outcome are required' },
        { status: 400 }
      );
    }

    // Get supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get all filled orders for this market
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'filled');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    console.log('Found orders:', orders);

    // Calculate total volume from both sides
    const totalYesVolume = orders.reduce((acc, order) => {
      if (order.position === 'yes' && order.side === 'buy') {
        return acc + (order.filled_amount * (order.price || 0));
      }
      return acc;
    }, 0);

    const totalNoVolume = orders.reduce((acc, order) => {
      if (order.position === 'no' && order.side === 'buy') {
        return acc + (order.filled_amount * (order.price || 0));
      }
      return acc;
    }, 0);

    const totalVolume = totalYesVolume + totalNoVolume;
    console.log('Volume calculations:', { totalYesVolume, totalNoVolume, totalVolume });

    // Update market outcome and status
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        resolved_value: outcome,
        outcome: outcome ? 'yes' : 'no',
        status: 'resolved',
        total_volume: totalVolume,
        updated_at: new Date().toISOString()
      })
      .eq('id', marketId);

    if (updateError) {
      console.error('Error updating market:', updateError);
      return NextResponse.json(
        { error: 'Failed to update market' },
        { status: 500 }
      );
    }

    // Calculate winning and losing positions
    const winningPosition = outcome ? 'yes' : 'no';
    const losingPosition = outcome ? 'no' : 'yes';
    const userPositions = new Map();

    // First pass: Calculate net positions for all users
    orders.forEach(order => {
      if (!order.user_id) return;

      const existingPosition = userPositions.get(order.user_id) || {
        userId: order.user_id,
        yesAmount: 0,
        noAmount: 0,
        netYesValue: 0,
        netNoValue: 0
      };

      const orderValue = order.filled_amount * (order.price || 0);

      if (order.position === 'yes') {
        if (order.side === 'buy') {
          existingPosition.yesAmount += order.filled_amount;
          existingPosition.netYesValue += orderValue;
        } else {
          existingPosition.yesAmount -= order.filled_amount;
          existingPosition.netYesValue -= orderValue;
        }
      } else {
        if (order.side === 'buy') {
          existingPosition.noAmount += order.filled_amount;
          existingPosition.netNoValue += orderValue;
        } else {
          existingPosition.noAmount -= order.filled_amount;
          existingPosition.netNoValue -= orderValue;
        }
      }

      userPositions.set(order.user_id, existingPosition);
    });

    console.log('User positions:', Array.from(userPositions.entries()));

    // Calculate total winning stake and losing pool
    const winningPool = outcome ? totalYesVolume : totalNoVolume;
    const losingPool = outcome ? totalNoVolume : totalYesVolume;
    console.log('Pools:', { winningPool, losingPool });

    // Calculate fees
    const CREATOR_FEE_PERCENTAGE = 0.003; // 0.3%
    const VALIDATOR_FEE_PERCENTAGE = 0.002; // 0.2%
    const creatorFee = losingPool * CREATOR_FEE_PERCENTAGE;
    const validatorFee = losingPool * VALIDATOR_FEE_PERCENTAGE;
    const remainingLosingPool = losingPool - creatorFee - validatorFee;

    console.log('Fees:', { creatorFee, validatorFee, remainingLosingPool });

    // Get market creator
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('creator_id')
      .eq('id', marketId)
      .single();

    if (marketError) {
      console.error('Error fetching market:', marketError);
      return NextResponse.json(
        { error: 'Failed to fetch market creator' },
        { status: 500 }
      );
    }

    // Get validator (user resolving the market)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Error getting validator:', authError);
      return NextResponse.json(
        { error: 'Failed to get validator' },
        { status: 500 }
      );
    }

    // Distribute fees to creator
    if (market.creator_id) {
      const { data: creatorProfile, error: creatorProfileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', market.creator_id)
        .single();

      if (!creatorProfileError && creatorProfile) {
        const newCreatorBalance = (creatorProfile.balance || 0) + creatorFee;
        await supabase
          .from('profiles')
          .update({
            balance: newCreatorBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', market.creator_id);

        console.log('Creator fee distributed:', {
          creatorId: market.creator_id,
          fee: creatorFee,
          newBalance: newCreatorBalance
        });
      }
    }

    // Distribute fees to validator
    if (user?.id) {
      const { data: validatorProfile, error: validatorProfileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (!validatorProfileError && validatorProfile) {
        const newValidatorBalance = (validatorProfile.balance || 0) + validatorFee;
        await supabase
          .from('profiles')
          .update({
            balance: newValidatorBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        console.log('Validator fee distributed:', {
          validatorId: user.id,
          fee: validatorFee,
          newBalance: newValidatorBalance
        });
      }
    }

    let successfulDistributions = 0;

    // Distribute winnings using remaining pool
    for (const position of userPositions.values()) {
      const netWinningAmount = outcome ? position.yesAmount : position.noAmount;
      const netWinningValue = outcome ? position.netYesValue : position.netNoValue;

      console.log('Processing user position:', {
        userId: position.userId,
        netWinningAmount,
        netWinningValue
      });

      if (netWinningAmount <= 0) {
        console.log('Skipping user due to non-positive winning amount');
        continue;
      }

      // Calculate user's share of the winning pool and their portion of the remaining losing pool
      const shareOfWinning = netWinningValue / winningPool;
      const winnings = netWinningValue + (shareOfWinning * remainingLosingPool);

      console.log('Calculated winnings:', {
        userId: position.userId,
        shareOfWinning,
        winnings
      });

      // Get current balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', position.userId)
        .single();

      if (profileError) {
        console.error(`Failed to fetch balance for user ${position.userId}:`, profileError);
        continue;
      }

      const currentBalance = profile?.balance || 0;
      const newBalance = currentBalance + winnings;

      console.log('Balance update:', {
        userId: position.userId,
        currentBalance,
        winnings,
        newBalance
      });

      // Update user's balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', position.userId);

      if (balanceError) {
        console.error(`Failed to update balance for user ${position.userId}:`, balanceError);
        continue;
      }

      successfulDistributions++;
    }

    // Mark market as settled
    await supabase
      .from('markets')
      .update({
        status: 'settled',
        updated_at: new Date().toISOString()
      })
      .eq('id', marketId);

    return NextResponse.json({
      success: true,
      redistributedAmount: totalVolume,
      winningPosition,
      winnersCount: successfulDistributions
    });

  } catch (error) {
    console.error('Error resolving market:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
