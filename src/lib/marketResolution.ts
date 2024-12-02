/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

interface MarketResolutionResult {
  success: boolean;
  error?: string;
  redistributedAmount?: number;
  winningPosition?: 'yes' | 'no';
  winnersCount?: number;
}

interface UserPosition {
  userId: string;
  netAmount: number;
  averagePrice: number;
}

export async function redistributeMarketFunds(marketId: string): Promise<MarketResolutionResult> {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Start a transaction
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (marketError) throw new Error('Failed to fetch market');
    if (!market) throw new Error('Market not found');
    if (market.status !== 'resolved') throw new Error('Market is not resolved');
    if (market.resolved_value === null) throw new Error('Market outcome is not set');

    // Determine winning position
    const winningPosition = market.resolved_value ? 'yes' : 'no';

    // Get all filled orders for this market
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'filled');

    if (ordersError) throw new Error('Failed to fetch orders');
    if (!orders) throw new Error('No orders found');

    // Calculate net positions for each user
    const userPositions = new Map<string, UserPosition>();

    orders.forEach(order => {
      if (!order.user_id) return;
      
      const amount = order.filled_amount * (order.price || 0);
      const position = order.position;
      
      if (position === winningPosition) {
        const existingPosition = userPositions.get(order.user_id) || {
          userId: order.user_id,
          netAmount: 0,
          averagePrice: 0
        };

        if (order.side === 'buy') {
          existingPosition.netAmount += order.filled_amount;
          existingPosition.averagePrice = ((existingPosition.averagePrice * (existingPosition.netAmount - order.filled_amount)) + 
            (order.price || 0) * order.filled_amount) / existingPosition.netAmount;
        } else if (order.side === 'sell') {
          existingPosition.netAmount -= order.filled_amount;
          // Adjust average price if there are still holdings
          if (existingPosition.netAmount > 0) {
            existingPosition.averagePrice = ((existingPosition.averagePrice * (existingPosition.netAmount + order.filled_amount)) - 
              (order.price || 0) * order.filled_amount) / existingPosition.netAmount;
          }
        }

        if (existingPosition.netAmount > 0) {
          userPositions.set(order.user_id, existingPosition);
        } else {
          userPositions.delete(order.user_id); // Remove if net position is 0 or negative
        }
      }
    });

    // Calculate total winning position volume for proportional distribution
    const totalWinningVolume = Array.from(userPositions.values()).reduce(
      (acc, position) => acc + (position.netAmount * position.averagePrice), 
      0
    );

    // Distribute winnings
    const totalVolume = market.total_volume || 0;
    let successfulDistributions = 0;

    for (const position of userPositions.values()) {
      if (position.netAmount <= 0) continue;

      const userShare = (position.netAmount * position.averagePrice) / totalWinningVolume;
      const winnings = totalVolume * userShare;

      // Get current user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', position.userId)
        .single();

      if (profileError) {
        console.error(`Failed to fetch balance for user ${position.userId}:`, profileError);
        continue;
      }
      if (!profile) {
        console.error(`Profile not found for user ${position.userId}`);
        continue;
      }

      const currentBalance = profile.balance || 0;
      const newBalance = currentBalance + winnings;

      // Update user's balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', position.userId);

      if (updateError) {
        console.error(`Failed to update balance for user ${position.userId}:`, updateError);
        continue;
      }

      successfulDistributions++;
    }

    // Update market status to indicate funds have been redistributed
    const { error: marketUpdateError } = await supabase
      .from('markets')
      .update({ 
        status: 'settled',
        updated_at: new Date().toISOString()
      })
      .eq('id', marketId);

    if (marketUpdateError) throw new Error('Failed to update market status');

    return {
      success: true,
      redistributedAmount: totalVolume,
      winningPosition,
      winnersCount: successfulDistributions
    };

  } catch (error) {
    console.error('Error redistributing market funds:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
