"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaCalendarWeek, FaCalendarAlt, FaInfinity } from 'react-icons/fa';
import UserRankCard from './UserRankCard';
import LeaderboardStats from './LeaderboardStats';

export type LeaderboardUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  points: number;
  total_predictions: number;
  correct_predictions: number;
};

type TimeFrame = 'week' | 'month' | 'all';

const timeFrameOptions = [
  { value: 'week' as TimeFrame, label: 'Week', icon: FaCalendarWeek },
  { value: 'month' as TimeFrame, label: 'Month', icon: FaCalendarAlt },
  { value: 'all' as TimeFrame, label: 'All Time', icon: FaInfinity }
] as const;

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`/api/leaderboard?timeframe=${timeFrame}`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFrame]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary/80 rounded w-1/4"></div>
            <div className="h-96 bg-secondary/80 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <FaTrophy className="text-3xl bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Leaderboard
            </h1>
          </div>

          {/* Time Frame Selector */}
          <div className="flex space-x-2 bg-secondary/80 rounded-lg p-1">
            {timeFrameOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTimeFrame(value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  timeFrame === value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <Icon className="text-sm" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-12">
          <LeaderboardStats users={users} />
        </div>

        {/* Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {users.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <UserRankCard
                user={user}
                rank={index + 1}
                isPodium={true}
              />
            </motion.div>
          ))}
        </div>

        {/* Rest of Leaderboard */}
        <div className="space-y-4">
          {users.slice(3).map((user, index) => (
            <UserRankCard
              key={user.id}
              user={user}
              rank={index + 4}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
