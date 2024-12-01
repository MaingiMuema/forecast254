/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface MarketData {
  id: string;
  question: string;
  description: string;
  category: string;
  created_at: string;
  closing_date: string | null;
  status: string;
  creator_id: string;
  resolved_value?: boolean;
  total_volume: number;
  trades: number;
  probability_yes: number;
  probability_no: number;
  total_yes_amount: number;
  total_no_amount: number;
}

interface OrderSummary {
  total_buy_volume: number;
  total_sell_volume: number;
  trade_count: number;
}

interface OrderAmount {
  position: 'yes' | 'no';
  amount: number;
  price: number | null;
}

export default function MarketHeader({ marketId }: { marketId: string }) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    total_buy_volume: 0,
    total_sell_volume: 0,
    trade_count: 0
  });
  const [totalAmounts, setTotalAmounts] = useState<{ totalYesAmount: number; totalNoAmount: number }>({
    totalYesAmount: 0,
    totalNoAmount: 0
  });

  const fetchOrderSummary = async (supabase: any) => {
    try {
      // Get total buy volume (filled buy orders)
      const { data: buyVolume, error: buyError } = await supabase
        .from('orders')
        .select('filled_amount, price')
        .eq('market_id', marketId)
        .eq('side', 'buy')
        .eq('status', 'filled');

      if (buyError) throw buyError;

      // Get total sell volume (filled sell orders)
      const { data: sellVolume, error: sellError } = await supabase
        .from('orders')
        .select('filled_amount, price')
        .eq('market_id', marketId)
        .eq('side', 'sell')
        .eq('status', 'filled');

      if (sellError) throw sellError;

      // Calculate total volumes - sum of all trading activity
      const totalBuyVolume = buyVolume.reduce((acc: number, order: any) => 
        acc + (order.filled_amount * order.price), 0);
      const totalSellVolume = sellVolume.reduce((acc: number, order: any) => 
        acc + (order.filled_amount * order.price), 0);

      // Total volume is the sum of all trading activity
      setOrderSummary({
        total_buy_volume: totalBuyVolume,
        total_sell_volume: totalSellVolume,
        trade_count: buyVolume.length + sellVolume.length
      });
    } catch (error) {
      console.error('Failed to fetch order summary:', error);
    }
  };

  const fetchTotalAmounts = async (supabase: any) => {
    try {
      // Get total amounts from filled buy orders
      const { data, error } = await supabase
        .from('orders')
        .select('position, amount, price')
        .eq('market_id', marketId)
        .eq('status', 'filled')
        .eq('side', 'buy');

      if (error) throw error;

      let totalYesAmount = 0;
      let totalNoAmount = 0;

      data?.forEach((order: OrderAmount) => {
        const orderValue = order.amount * (order.price || 0);
        if (order.position === 'yes') {
          totalYesAmount += orderValue;
        } else {
          totalNoAmount += orderValue;
        }
      });

      setTotalAmounts({ totalYesAmount, totalNoAmount });
    } catch (error) {
      console.error('Error fetching total amounts:', error);
    }
  };

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const supabase = createClientComponentClient<Database>();
        
        // First try to fetch from the markets table
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('*')
          .eq('id', marketId)
          .single();

        if (marketError) {
          console.error('Supabase error:', marketError);
          throw new Error(marketError.message);
        }

        if (!marketData) {
          throw new Error('Market not found');
        }

        // Fetch order summary
        await fetchOrderSummary(supabase);
        await fetchTotalAmounts(supabase);

        // Transform and set the market data
        setMarket({
          id: marketData.id,
          question: marketData.question || '',
          description: marketData.description || '',
          category: marketData.category || '',
          created_at: marketData.created_at || new Date().toISOString(),
          closing_date: marketData.closing_date || null,
          status: marketData.status || '',
          creator_id: marketData.creator_id || '',
          resolved_value: marketData.resolved_value || false,
          total_volume: orderSummary.total_buy_volume + orderSummary.total_sell_volume,
          trades: orderSummary.trade_count,
          probability_yes: marketData.probability_yes || 0.5,
          probability_no: marketData.probability_no || 0.5,
          total_yes_amount: marketData.total_yes_amount || 0,
          total_no_amount: marketData.total_no_amount || 0
        });
        setError(null);
      } catch (error) {
        console.error('Failed to fetch market:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();

    // Set up real-time subscription for orders
    const supabase = createClientComponentClient<Database>();
    const ordersChannel = supabase
      .channel(`orders_${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        async () => {
          // Recalculate order summary when orders change
          await fetchOrderSummary(supabase);
          await fetchTotalAmounts(supabase);
        }
      )
      .subscribe();

    // Set up real-time subscription for market data
    const marketChannel = supabase
      .channel(`market_${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
          filter: `id=eq.${marketId}`,
        },
        async (payload) => {
          if (payload.new && market) {
            const newData = payload.new as any;
            setMarket({
              ...market,
              question: newData.question || market.question,
              description: newData.description || market.description,
              category: newData.category || market.category,
              status: newData.status || market.status,
              resolved_value: newData.resolved_value,
              probability_yes: newData.probability_yes || market.probability_yes,
              probability_no: newData.probability_no || market.probability_no,
              total_yes_amount: newData.total_yes_amount || market.total_yes_amount,
              total_no_amount: newData.total_no_amount || market.total_no_amount,
              total_volume: orderSummary.total_buy_volume + orderSummary.total_sell_volume,
              trades: orderSummary.trade_count
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(marketChannel);
    };
  }, [marketId, orderSummary]);

  if (loading) {
    return <div className="h-48 animate-pulse bg-gray-800 rounded-lg" />;
  }

  if (error || !market) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="text-center text-red-400">
          <p>{error || 'Failed to load market data'}</p>
        </div>
      </div>
    );
  }

  const timeLeft = market.closing_date 
    ? new Date(market.closing_date).getTime() - new Date().getTime()
    : 0;
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      {/* Category and Stats */}
      <div className="flex items-center justify-between">
        <Link
          href={`/markets?category=${market.category ? market.category.toLowerCase() : 'all'}`}
          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          {market.category || 'Uncategorized'}
        </Link>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <UserGroupIcon className="h-4 w-4" />
            <span>{market.trades || 0} trades</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>{daysLeft} days left</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">{market.question}</h1>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-gray-400 text-sm">Total Volume</p>
            <p className="text-xl font-bold text-white">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(market.total_volume || 0)}
            </p>
          </div>
          <ArrowTrendingUpIcon className="h-8 w-8 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-lg p-4"
        >
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">YES Shares</span>
            <span className="text-xl font-bold text-white">
              {totalAmounts.totalYesAmount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 mt-2">
              {(market.probability_yes * 100).toFixed(1)}% Probability
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-lg p-4"
        >
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">NO Shares</span>
            <span className="text-xl font-bold text-white">
              {totalAmounts.totalNoAmount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 mt-2">
              {(market.probability_no * 100).toFixed(1)}% Probability
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
