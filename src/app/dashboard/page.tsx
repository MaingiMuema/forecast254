/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { FaChartBar, FaExchangeAlt, FaMoneyBillWave, FaWallet } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface Trade {
  id: string;
  amount: number | null;
  price: number | null;
  filled_amount: number | null;
  side: string | null;
  status: string;
  market_id?: string | null;
  user_id?: string | null;
  order_type?: string | null;
  position?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface DashboardStats {
  totalMarkets: number;
  userTrades: number;
  userVolume: number;
  portfolioValue: number;
  marketsTrend: number;
  tradesTrend: number;
  volumeTrend: number;
  portfolioTrend: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMarkets: 0,
    userTrades: 0,
    userVolume: 0,
    portfolioValue: 0,
    marketsTrend: 0,
    tradesTrend: 0,
    volumeTrend: 0,
    portfolioTrend: 0,
  });

  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const trend = ((current - previous) / previous) * 100;
    return Math.round(trend);
  };

  // Helper function to safely calculate volume from trades
  const calcVolume = (trades: Trade[] | null): number => {
    if (!trades) return 0;
    
    return trades.reduce((sum, order) => {
      if (order.status === 'pending') return sum;
      const amount = order.filled_amount || order.amount || 0;
      const price = order.price || 0;
      return sum + (amount * price);
    }, 0);
  };

  // Helper function to safely calculate portfolio value
  const calcPortfolioValue = (trades: Trade[] | null, balance: number, includeBalance = true): number => {
    if (!trades) return includeBalance ? balance : 0;
    
    return trades.reduce((sum, order) => {
      if (order.status === 'pending') return sum;
      const amount = order.filled_amount || order.amount || 0;
      const price = order.price || 0;
      const multiplier = order.side === 'buy' ? 1 : -1;
      return sum + (amount * price * multiplier);
    }, includeBalance ? balance : 0);
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      // Time periods for trend calculation
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      const userBalance = profile?.balance || 0;

      // Get markets counts for trend
      const { data: currentMarkets } = await supabase
        .from('markets')
        .select('id')
        .gte('created_at', lastMonth)
        .lt('created_at', thisMonth);

      const { data: previousMarkets } = await supabase
        .from('markets')
        .select('id')
        .gte('created_at', twoMonthsAgo)
        .lt('created_at', lastMonth);

      const marketsTrend = calculateTrend(
        currentMarkets?.length || 0,
        previousMarkets?.length || 0
      );

      // Get monthly trades
      const { data: currentTrades } = await supabase
        .from('orders')
        .select('id, amount, price, filled_amount, side, status')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('created_at', lastMonth)
        .lt('created_at', thisMonth);

      const { data: previousTrades } = await supabase
        .from('orders')
        .select('id, amount, price, filled_amount, side, status')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('created_at', twoMonthsAgo)
        .lt('created_at', lastMonth);

      // Calculate volumes with null-safe helper
      const currentVolume = calcVolume(currentTrades);
      const previousVolume = calcVolume(previousTrades);
      
      const tradesTrend = calculateTrend(
        currentTrades?.length || 0,
        previousTrades?.length || 0
      );

      const volumeTrend = calculateTrend(currentVolume, previousVolume);

      // Get all user trades for total counts
      const { data: allTrades } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      // Calculate total volume with null-safe helper
      const userVolume = calcVolume(allTrades);

      // Calculate portfolio values with null-safe helper
      const currentPortfolioValue = Math.abs(calcPortfolioValue(currentTrades, userBalance));
      const previousPortfolioValue = Math.abs(calcPortfolioValue(previousTrades, userBalance));
      const totalPortfolioValue = Math.abs(calcPortfolioValue(allTrades, userBalance));

      const portfolioTrend = calculateTrend(currentPortfolioValue, previousPortfolioValue);

      // Get total markets
      const { data: markets } = await supabase
        .from('markets')
        .select('id');

      setStats({
        totalMarkets: markets?.length || 0,
        userTrades: allTrades?.length || 0,
        userVolume,
        portfolioValue: totalPortfolioValue,
        marketsTrend,
        tradesTrend,
        volumeTrend,
        portfolioTrend
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
          icon={FaChartBar}
          trend={`${stats.marketsTrend > 0 ? '+' : ''}${stats.marketsTrend}%`}
          trendUp={stats.marketsTrend > 0}
        />
        <StatCard
          title="Your Trades"
          value={stats.userTrades}
          description="Your total completed trades"
          icon={FaExchangeAlt}
          trend={`${stats.tradesTrend > 0 ? '+' : ''}${stats.tradesTrend}%`}
          trendUp={stats.tradesTrend > 0}
        />
        <StatCard
          title="Your Volume"
          value={stats.userVolume}
          description="Your total trading volume"
          icon={FaMoneyBillWave}
          trend={`${stats.volumeTrend > 0 ? '+' : ''}${stats.volumeTrend}%`}
          trendUp={stats.volumeTrend > 0}
          valuePrefix="KES"
        />
        <StatCard
          title="Portfolio Value"
          value={stats.portfolioValue}
          description="Your current portfolio value"
          icon={FaWallet}
          trend={`${stats.portfolioTrend > 0 ? '+' : ''}${stats.portfolioTrend}%`}
          trendUp={stats.portfolioTrend > 0}
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
