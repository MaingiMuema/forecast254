/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { FaHistory } from 'react-icons/fa';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow } from 'date-fns';

type TimelineFilter = '24h' | '7d' | '30d' | 'all';
type ActivityType = 'all' | 'trades' | 'volume' | 'resolutions' | 'recent';

interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'resolution' | 'new_trade';
  amount: number;
  price?: number;
  timestamp: string;
  trader: string;
  marketId: string;
  marketTitle: string;
  outcomeIndex?: number;
  description?: string;
  category?: string;
  endDate?: string;
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
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
}

interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  closing_date: string;
  status: string;
  resolved_value: boolean | null;
}

export default function OverallActivity() {
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>('all');
  const [selectedType, setSelectedType] = useState<ActivityType>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Transform orders into trade activities
  const transformOrder = useCallback((order: Order, markets: Market[]): Activity => ({
    id: order.id,
    type: order.side,
    amount: order.filled_amount,
    price: order.price,
    timestamp: order.created_at,
    trader: order.user_id || 'Anonymous',
    marketId: order.market_id,
    marketTitle: markets.find(m => m.id === order.market_id)?.title || 'Unknown Market',
    category: markets.find(m => m.id === order.market_id)?.category,
    description: markets.find(m => m.id === order.market_id)?.description,
  }), []);

  // Transform market into resolution activity
  const transformMarket = useCallback((market: Market): Activity => ({
    id: `resolution-${market.id}`,
    type: 'resolution',
    amount: 0,
    timestamp: market.closing_date,
    trader: 'System',
    marketId: market.id,
    marketTitle: market.title,
    outcomeIndex: market.resolved_value ? 1 : 0,
    category: market.category,
    description: market.description,
    endDate: market.closing_date,
  }), []);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      
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
          startDate = new Date(0);
          break;
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'filled')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw new Error(ordersError.message);
      }

      // Fetch markets
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .order('created_at', { ascending: false });  

      if (marketsError) {
        console.error('Error fetching markets:', marketsError);
        throw new Error(marketsError.message);
      }

      const orders = ordersData || [];
      const markets = marketsData || [];

      // Debug logs
      console.log('Orders:', orders);
      console.log('Markets:', markets);
      
      // Get unique market IDs from orders
      const marketIds = [...new Set(orders.map(order => order.market_id))];
      console.log('Market IDs from orders:', marketIds);
      
      // Check which market IDs are found in markets
      const foundMarkets = markets.filter(market => marketIds.includes(market.id));
      console.log('Found markets:', foundMarkets);
      
      // Check which market IDs are missing
      const missingMarketIds = marketIds.filter(id => !markets.find(m => m.id === id));
      console.log('Missing market IDs:', missingMarketIds);

      // Transform orders and markets into activities
      const allActivities: Activity[] = [
        ...orders.map(order => {
          const market = markets.find(m => m.id === order.market_id);
          if (!market) {
            console.log('Market not found for order:', order);
          }
          return transformOrder(order, markets);
        }),
        ...markets
          .filter(market => market.status === 'resolved' && market.resolved_value !== null)
          .map(transformMarket)
      ];

      // Filter activities based on selected type
      const filteredActivities = selectedType === 'all'
        ? allActivities
        : selectedType === 'trades'
          ? allActivities.filter(a => a.type === 'buy' || a.type === 'sell')
          : selectedType === 'resolutions'
            ? allActivities.filter(a => a.type === 'resolution')
            : selectedType === 'volume'
              ? allActivities
                  .filter(a => a.type === 'buy' || a.type === 'sell')
                  .sort((a, b) => b.amount - a.amount)
              : allActivities.filter(a => a.type === 'new_trade');

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching activities:', error instanceof Error ? error.message : 'Unknown error');
      setActivities([]); // Set empty activities on error
    } finally {
      setLoading(false);
    }
  }, [selectedTimeline, selectedType, supabase, transformOrder, transformMarket]);

  // Set up real-time subscriptions
  useEffect(() => {
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => fetchActivities()
      )
      .subscribe();

    const marketsChannel = supabase
      .channel('markets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markets',
        },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
      marketsChannel.unsubscribe();
    };
  }, [supabase, fetchActivities]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'buy':
        return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />;
      case 'sell':
        return <ArrowDownIcon className="h-4 w-4 text-rose-500" />;
      case 'resolution':
        return <ArrowUpIcon className="h-4 w-4 text-purple-500" />;
      case 'new_trade':
        return <ChartBarIcon className="h-4 w-4 text-indigo-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'buy':
        return 'bg-emerald-500/10';
      case 'sell':
        return 'bg-rose-500/10';
      case 'resolution':
        return 'bg-purple-500/10';
      case 'new_trade':
        return 'bg-indigo-500/10';
    }
  };

  const getActivityLabel = (activity: Activity) => {
    switch (activity.type) {
      case 'buy':
        return `Buy @ KES ${activity.price}`;
      case 'sell':
        return `Sell @ KES ${activity.price}`;
      case 'resolution':
        return `Market Resolved${activity.outcomeIndex !== undefined ? ` (Outcome ${activity.outcomeIndex})` : ''}`;
      case 'new_trade':
        return 'New Market Added';
    }
  };

  const renderActivityContent = (activity: Activity) => {
    if (activity.type === 'new_trade') {
      return (
        <>
          <Link
            href={`/market/${activity.marketId}`}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {activity.marketTitle}
          </Link>
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded-full">
                {activity.category}
              </span>
              <span className="text-xs text-muted-foreground">
                Ends {new Date(activity.endDate || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Link
          href={`/market/${activity.marketId}`}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {activity.marketTitle}
        </Link>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">
            {getActivityLabel(activity)}
          </p>
          <span className="text-xs text-muted-foreground">•</span>
          <p className="text-xs text-muted-foreground">
            by {activity.trader.slice(0, 6)}...{activity.trader.slice(-4)}
          </p>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-card rounded-xl p-4 sm:p-6 h-[600px] flex flex-col overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaHistory className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Market Activity</h2>
            </div>
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex flex-wrap gap-2">
                {(['all', 'trades', 'volume', 'resolutions', 'recent'] as ActivityType[]).map((type) => (
                  <div key={type} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
                ))}
              </div>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="flex flex-wrap gap-2">
                {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
                  <div key={timeline} className="h-8 w-12 bg-muted animate-pulse rounded-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="bg-card rounded-xl p-4 sm:p-6 h-[600px] flex flex-col overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaHistory className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Market Activity</h2>
          </div>
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'trades', 'volume', 'resolutions', 'recent'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                    selectedType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <div className="flex flex-wrap gap-2">
              {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
                <button
                  key={timeline}
                  onClick={() => setSelectedTimeline(timeline)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                    selectedTimeline === timeline
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {timeline}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
          <div className="space-y-4 pr-2">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-muted/50 rounded-lg p-3 sm:p-4 ${
                    activity.type === 'new_trade' ? 'border border-indigo-500/10' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)} shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {renderActivityContent(activity)}
                      </div>
                    </div>
                    <div className="text-left sm:text-right pl-11 sm:pl-0 sm:ml-4">
                      {activity.type !== 'new_trade' && (
                        <p className="text-sm font-medium text-foreground">
                          {activity.amount.toLocaleString()} Shares
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp))}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}