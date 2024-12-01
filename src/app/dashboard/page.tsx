/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { FaChartLine, FaWallet, FaUsers } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalMarkets: number;
  userTrades: number;
  userVolume: number;
  portfolioValue: number;
  tradesTrend: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMarkets: 0,
    userTrades: 0,
    userVolume: 0,
    portfolioValue: 0,
    tradesTrend: 0,
  });

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }
      console.log('Current user:', user.id);

      // Get user's profile to fetch balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      const userBalance = profile?.balance || 0;
      console.log('User balance:', userBalance);

      // Get markets count
      const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('id', { count: 'exact' });

      if (marketsError) throw marketsError;
      console.log('Total markets:', markets?.length);

      // Get user's trades - include all non-cancelled orders
      const { data: userTrades, error: tradesError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      if (tradesError) throw tradesError;
      console.log('User trades:', userTrades);

      // Calculate 24h trends
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      // Get today's trades
      const { data: currentTrades } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('created_at', oneDayAgo);

      // Get previous day's trades
      const { data: previousTrades } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('created_at', twoDaysAgo)
        .lt('created_at', oneDayAgo);

      console.log('24h trades:', currentTrades?.length);
      console.log('Previous 24h trades:', previousTrades?.length);

      // Calculate trend percentage
      const currentCount = currentTrades?.length || 0;
      const previousCount = previousTrades?.length || 0;
      const tradesTrend = previousCount === 0 
        ? 100 
        : ((currentCount - previousCount) / previousCount) * 100;

      // Calculate user's trading volume from all non-cancelled orders
      const userVolume = userTrades?.reduce((sum, order) => {
        const amount = order.filled_amount || order.amount || 0;
        const price = order.price || 0;
        return sum + (amount * price);
      }, 0) || 0;

      console.log('User volume:', userVolume);

      // Calculate portfolio value considering buy/sell positions and user balance
      const portfolioValue = userTrades?.reduce((sum, order) => {
        if (order.status === 'pending') return sum; // Skip pending orders
        
        const amount = order.filled_amount || order.amount || 0;
        const price = order.price || 0;
        const multiplier = order.side === 'buy' ? 1 : -1;
        
        return sum + (amount * price * multiplier);
      }, userBalance) || userBalance; // Start with user's balance

      console.log('Portfolio value (including balance):', portfolioValue);

      setStats({
        totalMarkets: markets?.length || 0,
        userTrades: userTrades?.length || 0,
        userVolume: userVolume, // Include balance in volume
        portfolioValue: Math.abs(portfolioValue),
        tradesTrend: Math.round(tradesTrend)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your prediction market activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Markets"
          value={stats.totalMarkets}
          description="Available prediction markets"
          icon={FaChartLine}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Your Trades"
          value={stats.userTrades}
          description="Your total completed trades"
          icon={FaChartLine}
          trend={stats.tradesTrend > 0 ? `+${stats.tradesTrend}%` : `${stats.tradesTrend}%`}
          trendUp={stats.tradesTrend > 0}
        />
        <StatCard
          title="Your Volume"
          value={stats.userVolume}
          description="Your total trading volume"
          icon={FaWallet}
          trend="+15%"
          trendUp={true}
          valuePrefix="KES"
        />
        <StatCard
          title="Portfolio Value"
          value={stats.portfolioValue}
          description="Your current portfolio value"
          icon={FaUsers}
          trend="+25%"
          trendUp={true}
          valuePrefix="KES"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem
            title="New Market Created"
            description="Kenya Presidential Election 2027"
            timestamp="2 hours ago"
            type="create"
          />
          <ActivityItem
            title="Position Taken"
            description="Bought YES at KES 0.65 - Tech Startup Funding Q1"
            timestamp="5 hours ago"
            type="trade"
          />
          <ActivityItem
            title="Market Resolved"
            description="Bitcoin Price Above $50k - March 2024"
            timestamp="1 day ago"
            type="resolve"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
  valuePrefix,
}: {
  title: string;
  value: number;
  description: string;
  icon: any;
  trend: string;
  trendUp: boolean;
  valuePrefix?: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {valuePrefix && <span>{valuePrefix} </span>}
            {value.toLocaleString()}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      <div className="mt-4 flex items-center">
        <span
          className={`text-sm font-medium ${
            trendUp ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {trend}
        </span>
        <span className="text-sm text-muted-foreground ml-2">vs last month</span>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  description,
  timestamp,
  type,
}: {
  title: string;
  description: string;
  timestamp: string;
  type: 'create' | 'trade' | 'resolve';
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'create':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'trade':
        return 'bg-blue-500/10 text-blue-500';
      case 'resolve':
        return 'bg-amber-500/10 text-amber-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className={`w-2 h-2 rounded-full ${getTypeStyles()}`} />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-sm text-muted-foreground">{timestamp}</p>
    </div>
  );
}
