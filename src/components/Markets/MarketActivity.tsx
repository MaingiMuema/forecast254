/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { FaHistory } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type TimelineFilter = '24h' | '7d' | '30d' | 'all';

interface Market {
  id: string;
  title: string;
  description: string;
  probability_yes: number;
  probability_no: number;
  total_volume: number;
  total_yes_amount: number;
  total_no_amount: number;
  closing_date: string;
  status: string;
  min_amount: number;
  max_amount: number;
  resolved_value: boolean | null;
  trades: number;
  views: number;
}

interface Order {
  id: string;
  market_id: string;
  user_id: string;
  order_type: 'limit' | 'market';
  side: 'buy' | 'sell';
  position: 'yes' | 'no';
  price: number;
  amount: number;
  filled_amount: number;
  remaining_amount: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export default function MarketActivity({ marketId }: { marketId: string }) {
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const supabase = createClientComponentClient();

  const calculateVolume = useCallback((orders: Order[]) => {
    return orders.reduce((total, order) => {
      if (order.status === 'filled') {
        return total + (order.filled_amount * order.price);
      }
      return total;
    }, 0);
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(`/api/markets/${marketId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data = await response.json();
      setMarket(data);
    } catch (error) {
      console.error('Error fetching market:', error);
      setError('Failed to load market data');
    }
  }, [marketId]);

  const fetchOrders = useCallback(async () => {
    try {
      // Calculate the start date based on the selected timeline
      const now = new Date();
      let startDate = now;
      switch (selectedTimeline) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Fetch filled orders for this market
      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('status', 'filled')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const filledOrders = data || [];
      setOrders(filledOrders);
      
      // Calculate and update total volume
      const volume = calculateVolume(filledOrders);
      setTotalVolume(volume);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load activity data');
      setLoading(false);
    }
  }, [marketId, selectedTimeline, supabase, calculateVolume]);

  // Initial fetch
  useEffect(() => {
    fetchMarketData();
    fetchOrders();
  }, [fetchMarketData, fetchOrders]);

  // Set up real-time updates
  useEffect(() => {
    // Subscribe to orders table changes
    const ordersSubscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          // Refetch orders when there's a change
          fetchOrders();
        }
      )
      .subscribe();

    // Set up interval for regular updates
    const intervalId = setInterval(() => {
      fetchMarketData();
      fetchOrders();
    }, 1000); // Update every second

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      ordersSubscription.unsubscribe();
    };
  }, [marketId, fetchMarketData, fetchOrders, supabase]);

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 sm:p-6">
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
          <div className="flex items-center space-x-2">
            <FaHistory className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
              <div key={timeline} className="h-8 w-12 bg-gray-800 animate-pulse rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
        <div className="flex items-center space-x-2">
          <FaHistory className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
            <button
              key={timeline}
              onClick={() => setSelectedTimeline(timeline)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                selectedTimeline === timeline
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {timeline}
            </button>
          ))}
        </div>
      </div>

      {market && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Volume</p>
              <p className="text-white font-medium">{formatPrice(totalVolume)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Trades</p>
              <p className="text-white font-medium">{orders.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Yes Probability</p>
              <p className="text-green-500 font-medium">{(market.probability_yes * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">No Probability</p>
              <p className="text-red-500 font-medium">{(market.probability_no * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No recent activity</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"
            >
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {order.position === 'yes' ? (
                  <ArrowUpIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowDownIcon className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-white font-medium">
                    {order.order_type === 'market' ? 'Market' : 'Limit'} {order.side.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-400">
                    by {order.user_id.slice(0, 6)}...{order.user_id.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className="text-right">
                  <p className={`font-medium ${order.position === 'yes' ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPrice(order.price)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(order.created_at))} ago
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{order.filled_amount} shares</p>
                  <p className="text-sm text-gray-400">
                    {formatPrice(order.price * order.filled_amount)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
