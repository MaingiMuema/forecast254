'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { FaCrown, FaTrophy, FaMedal } from 'react-icons/fa';

interface UserStats {
  id: string;
  username: string;
  avatar_url: string | null;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  successRate: number;
  totalTrades: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe]);

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);

      // Get date range based on timeframe
      const startDate = new Date();
      if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeframe === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      }

      // Fetch all users with their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, balance')
        .not('username', 'is', null);

      if (profilesError) throw profilesError;

      // Calculate stats for each user
      const userStats = await Promise.all(
        profiles.map(async (profile) => {
          // Fetch user's orders within timeframe
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
            .eq('user_id', profile.id)
            .eq('status', 'filled')
            .gte('created_at', startDate.toISOString());

          if (ordersError) throw ordersError;

          // Calculate performance metrics
          let totalValue = profile.balance || 0;
          let totalProfitLoss = 0;
          let successfulTrades = 0;
          const positions = new Map();

          orders.forEach((order) => {
            if (!order.market || order.market.status === 'resolved') {
              // For resolved markets, calculate profit/loss
              if (order.market?.resolved_value !== null) {
                const isCorrect = (order.position === 'yes') === order.market.resolved_value;
                if (isCorrect) successfulTrades++;
                const pnl = isCorrect ? order.filled_amount * (1 - order.price) : -order.filled_amount * order.price;
                totalProfitLoss += pnl;
              }
              return;
            }

            // For open positions, calculate current value
            const key = `${order.market_id}-${order.position}`;
            const position = positions.get(key) || {
              amount: 0,
              totalCost: 0,
              currentPrice: order.position === 'yes' ? order.market.yes_price : order.market.no_price
            };

            position.amount += order.filled_amount;
            position.totalCost += order.filled_amount * order.price;
            positions.set(key, position);
          });

          // Add current position values to total value
          positions.forEach(position => {
            const currentValue = position.amount * position.currentPrice;
            totalValue += currentValue;
            totalProfitLoss += currentValue - position.totalCost;
          });

          const totalTrades = orders.length;
          const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
          const profitLossPercentage = totalValue > 0 ? (totalProfitLoss / totalValue) * 100 : 0;

          return {
            id: profile.id,
            username: profile.username || 'Anonymous',
            avatar_url: profile.avatar_url,
            totalValue,
            profitLoss: totalProfitLoss,
            profitLossPercentage,
            successRate,
            totalTrades,
            rank: 0 // Will be set after sorting
          };
        })
      );

      // Sort users by total value and assign ranks
      const sortedUsers = userStats
        .sort((a, b) => b.totalValue - a.totalValue)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-400 text-2xl" />;
      case 2:
        return <FaTrophy className="text-gray-400 text-2xl" />;
      case 3:
        return <FaMedal className="text-amber-600 text-2xl" />;
      default:
        return <span className="text-gray-400 font-mono">{rank}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-gray-800 rounded-lg"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <div className="flex gap-2">
            {(['all', 'month', 'week'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-lg ${
                  timeframe === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`bg-gray-800 rounded-lg p-6 ${
                user.rank <= 3 ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{user.username}</h3>
                    <p className="text-sm text-gray-400">Rank #{user.rank}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Value</p>
                  <p className="font-medium">KES {user.totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Profit/Loss</p>
                  <p className={`font-medium ${user.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {user.profitLoss >= 0 ? '+' : '-'}KES {Math.abs(user.profitLoss).toLocaleString()}
                    <span className="text-sm ml-2">
                      ({user.profitLossPercentage >= 0 ? '+' : ''}
                      {user.profitLossPercentage.toFixed(2)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="font-medium">{user.successRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Trades</p>
                  <p className="font-medium">{user.totalTrades}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => window.location.href = `/profile/${user.id}`}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {users.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
