/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { FaChartBar, FaExchangeAlt, FaMoneyBillWave, FaWallet } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FiPlus, FiGrid, FiBarChart2 } from 'react-icons/fi';

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

interface Market {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  resolution_source: string;
  closing_date: string;
  resolution_date: string | null;
  status: 'open' | 'closed' | 'resolved';
  outcome: string | null;
  total_volume: number;
  liquidity_pool: number;
  created_at: string;
  updated_at: string;
  source_article_id: string | null;
  end_date: string | null;
  question: string | null;
  resolution_criteria: string | null;
  resolved_value: boolean | null;
  probability_yes: number;
  probability_no: number;
  views: number;
  trades: number;
  trending_score: number | null;
  min_amount: number;
  max_amount: number;
  total_yes_amount: number;
  total_no_amount: number;
  source_url: string | null;
  yes_price: number;
  no_price: number;
  last_trade_price: number | null;
  last_trade_time: string | null;
  active: boolean;
}

interface TradeActivity {
  id: string;
  created_at: string;
  side: 'buy' | 'sell';
  position: string;
  price: number;
  filled_amount: number;
  market: Market;
}

interface Activity {
  id: string;
  type: 'create' | 'trade' | 'resolve';
  title: string;
  description: string;
  created_at: string;
  market_id: string;
  user_id: string;
}

interface Order {
  id: string;
  user_id: string;
  market_id: string;
  filled_amount: number;
  price: number;
  position: 'yes' | 'no';
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  market: Market | null;
}

interface OrderWithMarket extends Order {
  market: Market;
}

interface Stats {
  userVolume: number;
  volumeTrend: number;
  portfolioValue: number;
  portfolioTrend: number;
}

interface PortfolioStats {
  currentValue: number;
  trend: number;
  previousValue: number;
  positions: {
    marketId: string;
    marketTitle: string;
    position: 'yes' | 'no';
    amount: number;
    value: number;
    profitLoss: number;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
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

  const [activities, setActivities] = useState<Activity[]>([]);

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

  // Calculate portfolio value and trend
  const calculatePortfolioStats = async (
    supabase: any,
    userId: string,
    includeBalance: boolean = true
  ): Promise<PortfolioStats> => {
    try {
      // Get user's balance
      const { data: balanceData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      const balance = balanceData?.balance || 0;

      // Get all orders with market data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          market:markets(
            id,
            title,
            status,
            yes_price,
            no_price,
            resolved_value
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'filled')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (ordersError) throw ordersError;

      // Group orders by market
      const marketPositions = new Map<string, {
        marketId: string;
        marketTitle: string;
        yesAmount: number;
        noAmount: number;
        totalCost: number;
      }>();

      (orders as Order[]).forEach((order: Order) => {
        if (!order.market || order.market.status === 'resolved') return;

        const position = marketPositions.get(order.market_id) || {
          marketId: order.market_id,
          marketTitle: order.market.title,
          yesAmount: 0,
          noAmount: 0,
          totalCost: 0
        };

        if (order.position === 'yes') {
          position.yesAmount += order.filled_amount;
        } else {
          position.noAmount += order.filled_amount;
        }
        position.totalCost += order.filled_amount * order.price;

        marketPositions.set(order.market_id, position);
      });

      // Calculate current portfolio value
      let currentValue = includeBalance ? balance : 0;
      const positions: PortfolioStats['positions'] = [];

      for (const position of marketPositions.values()) {
        const market = (orders as Order[]).find((o: Order) => o.market_id === position.marketId)?.market;
        if (!market) continue;

        // Calculate net position value
        const yesValue = position.yesAmount * market.yes_price;
        const noValue = position.noAmount * market.no_price;
        const positionValue = yesValue + noValue;
        const profitLoss = positionValue - position.totalCost;

        currentValue += positionValue;

        if (position.yesAmount > 0) {
          positions.push({
            marketId: position.marketId,
            marketTitle: position.marketTitle,
            position: 'yes',
            amount: position.yesAmount,
            value: yesValue,
            profitLoss: yesValue - (position.totalCost * (position.yesAmount / (position.yesAmount + position.noAmount)))
          });
        }

        if (position.noAmount > 0) {
          positions.push({
            marketId: position.marketId,
            marketTitle: position.marketTitle,
            position: 'no',
            amount: position.noAmount,
            value: noValue,
            profitLoss: noValue - (position.totalCost * (position.noAmount / (position.yesAmount + position.noAmount)))
          });
        }
      }

      // Calculate portfolio value from 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: oldOrders } = await supabase
        .from('orders')
        .select(`
          *,
          market:markets(
            id,
            yes_price,
            no_price,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'filled')
        .lt('created_at', twentyFourHoursAgo.toISOString());

      let previousValue = includeBalance ? balance : 0;

      if (oldOrders) {
        const oldPositions = new Map<string, { yesAmount: number; noAmount: number }>();

        (oldOrders as Order[]).forEach((order: Order) => {
          if (!order.market || order.market.status === 'resolved') return;

          const position = oldPositions.get(order.market_id) || { yesAmount: 0, noAmount: 0 };
          if (order.position === 'yes') {
            position.yesAmount += order.filled_amount;
          } else {
            position.noAmount += order.filled_amount;
          }
          oldPositions.set(order.market_id, position);
        });

        for (const [marketId, position] of oldPositions.entries()) {
          const market = (oldOrders as Order[]).find((o: Order) => o.market_id === marketId)?.market;
          if (!market) continue;

          previousValue += (position.yesAmount * market.yes_price) + (position.noAmount * market.no_price);
        }
      }

      // Calculate trend percentage
      const trend = previousValue > 0 
        ? ((currentValue - previousValue) / previousValue) * 100 
        : 0;

      return {
        currentValue: Math.round(currentValue * 100) / 100,
        previousValue: Math.round(previousValue * 100) / 100,
        trend: Math.round(trend * 100) / 100,
        positions: positions.sort((a, b) => b.value - a.value) // Sort by highest value first
      };
    } catch (error) {
      console.error('Error calculating portfolio stats:', error);
      return {
        currentValue: 0,
        previousValue: 0,
        trend: 0,
        positions: []
      };
    }
  };

  // Helper function to calculate stats excluding resolved markets
  const calculateStats = async (supabase: any, userId: string): Promise<Stats> => {
    try {
      const portfolioStats = await calculatePortfolioStats(supabase, userId, true);
      
      // Get all orders for volume calculation
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          market:markets(
            id,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'filled');

      if (ordersError) throw ordersError;

      // Calculate volume excluding resolved markets
      const volume = (orders as Order[])
        .filter((order: Order) => order.market && order.market.status !== 'resolved')
        .reduce((total: number, order: Order) => {
          return total + (order.filled_amount * order.price);
        }, 0);

      return {
        userVolume: Math.round(volume * 100) / 100,
        volumeTrend: 0, // You might want to implement volume trend calculation
        portfolioValue: portfolioStats.currentValue,
        portfolioTrend: portfolioStats.trend
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        userVolume: 0,
        volumeTrend: 0,
        portfolioValue: 0,
        portfolioTrend: 0
      };
    }
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

      const stats = await calculateStats(supabase, user.id);

      setStats({
        totalMarkets: markets?.length || 0,
        userTrades: allTrades?.length || 0,
        userVolume: stats.userVolume,
        portfolioValue: stats.portfolioValue,
        marketsTrend,
        tradesTrend,
        volumeTrend: stats.volumeTrend,
        portfolioTrend: stats.portfolioTrend
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  const fetchActivities = async () => {
    try {
      if (!user) return;

      // Fetch user's market creations
      const { data: markets } = await supabase
        .from('markets')
        .select('id, title, created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch user's trades
      const { data: trades } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          side,
          position,
          price,
          filled_amount,
          market:markets (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(5) as { data: TradeActivity[] | null };

      // Transform data into activities
      const marketActivities = (markets || []).map(market => ({
        id: `market-${market.id}`,
        type: 'create' as const,
        title: 'New Market Created',
        description: market.title || 'Untitled Market',
        created_at: market.created_at,
        market_id: market.id,
        user_id: user.id
      }));

      const tradeActivities = (trades || []).map(trade => ({
        id: `trade-${trade.id}`,
        type: 'trade' as const,
        title: 'Position Taken',
        description: `${trade.side === 'buy' ? 'Bought' : 'Sold'} ${trade.position?.toUpperCase()} at KES ${trade.price} - ${trade.market?.title}`,
        created_at: trade.created_at,
        market_id: trade.market?.id || '',
        user_id: user.id
      }));

      // Combine and sort activities
      const allActivities = [...marketActivities, ...tradeActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load recent activities');
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/dashboard/markets')}
            className="flex items-center gap-2"
          >
            <FiGrid className="w-4 h-4" />
            My Markets
          </Button>
          <Button
            onClick={() => router.push('/dashboard/trades')}
            className="flex items-center gap-2"
          >
            <FiBarChart2 className="w-4 h-4" />
            My Trades
          </Button>
        </div>
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
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No recent activity to show
            </div>
          ) : (
            activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                title={activity.title}
                description={activity.description}
                timestamp={formatTimeAgo(activity.created_at)}
                type={activity.type}
              />
            ))
          )}
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
