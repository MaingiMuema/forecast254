"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaCrown, FaMedal } from 'react-icons/fa';
import type { LeaderboardUser } from './LeaderboardPage';

type Props = {
  user: LeaderboardUser;
  rank: number;
  isPodium?: boolean;
};

export default function UserRankCard({ user, rank, isPodium = false }: Props) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-emerald-400 to-blue-500';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-400 text-2xl" />;
      case 2:
      case 3:
        return <FaMedal className={rank === 2 ? 'text-gray-400 text-xl' : 'text-amber-500 text-xl'} />;
      default:
        return null;
    }
  };

  const accuracy = user.total_predictions > 0
    ? ((user.correct_predictions / user.total_predictions) * 100).toFixed(1)
    : '0.0';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md p-6 ${
        isPodium 
          ? 'border-2 border-primary/50'
          : 'border border-border/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`absolute -top-2 -right-2 z-10 ${rank <= 3 ? 'block' : 'hidden'}`}>
              {getRankIcon(rank)}
            </div>
            <div className="relative h-16 w-16">
              <Image
                src={user.avatar_url || '/default-avatar.png'}
                alt={`${user.username}'s profile picture`}
                fill
                className="rounded-full object-cover border-4 border-background shadow-md"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold bg-gradient-to-r ${getRankColor(rank)} bg-clip-text text-transparent`}>
                #{rank}
              </span>
              <h3 className="font-semibold text-foreground text-lg">{user.username}</h3>
            </div>
            <p className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent font-medium">
              {user.points.toLocaleString()} points
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
            <p className="font-semibold text-foreground text-lg">{accuracy}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Predictions</p>
            <p className="font-semibold text-foreground text-lg">
              {user.total_predictions.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
