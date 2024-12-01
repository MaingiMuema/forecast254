/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

interface Order {
  id: number;
  market_id: number;
  position: string;
  user_id: number;
  side: string;
  order_type: string;
  price: number | null;
  filled_amount: number;
  remaining_amount: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function matchOrder(
  supabase: ReturnType<typeof createClient<Database>>,
  newOrder: Order
) {
  let remainingAmount = newOrder.remaining_amount ?? 0;

  if (remainingAmount === 0) return;

  try {
    // Get matching orders from the opposite side
    const { data: matchingOrders, error: matchError } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', newOrder.market_id)
      .eq('position', newOrder.position)
      .eq('status', 'open')
      .neq('user_id', newOrder.user_id)
      .eq('side', newOrder.side === 'buy' ? 'sell' : 'buy')
      .order('created_at', { ascending: true });

    if (matchError) {
      console.error('Error fetching matching orders:', matchError);
      return;
    }

    if (!matchingOrders || matchingOrders.length === 0) {
      return;
    }

    for (const matchingOrder of matchingOrders) {
      if (remainingAmount <= 0) break;

      // Skip if remaining amount or price is null
      if (matchingOrder.remaining_amount === null || matchingOrder.price === null) continue;

      // For market orders, match with any price
      if (newOrder.order_type === 'market') {
        // Market buy orders match with any ask price
        // Market sell orders match with any bid price
      } else if (newOrder.price === null) {
        continue; // Skip if limit order has null price
      }

      // Price matching logic for limit orders
      const priceMatches = newOrder.side === 'buy'
        ? (newOrder.price ?? 0) >= matchingOrder.price
        : (newOrder.price ?? 0) <= matchingOrder.price;

      if (!priceMatches) continue;

      const matchAmount = Math.min(
        remainingAmount,
        matchingOrder.remaining_amount
      );

      // Update both orders
      const updates = [];

      // Update new order
      updates.push(
        supabase
          .from('orders')
          .update({
            filled_amount: newOrder.filled_amount + matchAmount,
            remaining_amount: remainingAmount - matchAmount,
            status:
              remainingAmount - matchAmount === 0 ? 'filled' : 'partial',
            updated_at: new Date().toISOString(),
          })
          .eq('id', newOrder.id)
      );

      // Update matching order
      updates.push(
        supabase
          .from('orders')
          .update({
            filled_amount: matchingOrder.filled_amount + matchAmount,
            remaining_amount: matchingOrder.remaining_amount - matchAmount,
            status:
              matchingOrder.remaining_amount - matchAmount === 0
                ? 'filled'
                : 'partial',
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchingOrder.id)
      );

      // Update market probabilities
      const { data: market } = await supabase
        .from('markets')
        .select('total_yes_amount, total_no_amount')
        .eq('id', newOrder.market_id)
        .single();

      if (market) {
        let newYesAmount = market.total_yes_amount ?? 0;
        let newNoAmount = market.total_no_amount ?? 0;

        if (newOrder.position === 'yes') {
          newYesAmount += matchAmount;
        } else {
          newNoAmount += matchAmount;
        }

        const totalAmount = newYesAmount + newNoAmount;
        const probabilityYes = totalAmount > 0 ? newYesAmount / totalAmount : 0.5;
        const probabilityNo = totalAmount > 0 ? newNoAmount / totalAmount : 0.5;

        updates.push(
          supabase
            .from('markets')
            .update({
              total_yes_amount: newYesAmount,
              total_no_amount: newNoAmount,
              probability_yes: probabilityYes,
              probability_no: probabilityNo,
              updated_at: new Date().toISOString(),
            })
            .eq('id', newOrder.market_id)
        );
      }

      // Execute all updates in parallel
      await Promise.all(updates);

      // Update remaining amount for next iteration
      remainingAmount -= matchAmount;
      newOrder.filled_amount += matchAmount;
    }
  } catch (error) {
    console.error('Error in matchOrder:', error);
  }
}
