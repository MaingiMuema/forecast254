/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Market {
  id: string;
  trades: number;
  total_volume: number;
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

interface MarketStats {
  total_trades: number;
  total_volume: number;
  unique_traders: number;
}

export default function MarketStats({ marketId }: { marketId: string }) {
  const [stats, setStats] = useState<MarketStats>({
    total_trades: 0,
    total_volume: 0,
    unique_traders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const calculateStats = useCallback((orders: Order[]) => {
    console.log('Calculating stats from orders:', orders);

    const filledOrders = orders.filter(order => order.status === 'filled');
    console.log('Filled orders:', filledOrders);

    const volume = filledOrders.reduce((total, order) => {
      const orderVolume = order.filled_amount * order.price;
      console.log(`Order volume for ${order.id}: ${orderVolume} (${order.filled_amount} × ${order.price})`);
      return total + orderVolume;
    }, 0);

    const uniqueTraders = new Set(filledOrders.map(order => order.user_id));
    console.log('Unique traders:', Array.from(uniqueTraders));

    const stats = {
      total_trades: filledOrders.length,
      total_volume: volume,
      unique_traders: uniqueTraders.size,
    };

    console.log('Calculated stats:', stats);
    return stats;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      console.log('Fetching stats for market:', marketId);

      // Fetch all filled orders for this market
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId);

      if (ordersError) {
        console.error('Supabase error:', ordersError);
        throw ordersError;
      }

      console.log('Fetched orders:', orders);

      // Calculate stats from orders
      const newStats = calculateStats(orders || []);
      console.log('Setting new stats:', newStats);
      setStats(newStats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market stats:', error);
      setError('Failed to load market statistics');
      setLoading(false);
    }
  }, [marketId, supabase, calculateStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Set up real-time updates
  useEffect(() => {
    console.log('Setting up real-time updates for market:', marketId);

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
        (payload) => {
          console.log('Received real-time update:', payload);
          fetchStats();
        }
      )
      .subscribe();

    // Set up interval for regular updates
    const intervalId = setInterval(() => {
      fetchStats();
    }, 1000); // Update every second

    // Cleanup function
    return () => {
      console.log('Cleaning up subscriptions');
      clearInterval(intervalId);
      ordersSubscription.unsubscribe();
    };
  }, [marketId, fetchStats, supabase]);

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Market Stats</h2>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const formatValue = (value: number, prefix: string = '') => {
    return prefix + value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const statItems = [
    {
      label: 'Total Volume',
      value: formatValue(stats.total_volume, 'KES '),
      icon: ChartBarIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Trades',
      value: formatValue(stats.total_trades),
      icon: CurrencyDollarIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Unique Traders',
      value: formatValue(stats.unique_traders),
      icon: UserGroupIcon,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Market Stats</h2>
      <div className="grid grid-cols-1 gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-white">{item.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
