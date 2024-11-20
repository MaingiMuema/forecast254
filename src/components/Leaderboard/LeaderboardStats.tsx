"use client";

import { motion } from 'framer-motion';
import { FaUsers, FaChartBar, FaBullseye } from 'react-icons/fa';
import type { LeaderboardUser } from './LeaderboardPage';

type Props = {
  users: LeaderboardUser[];
};

export default function LeaderboardStats({ users }: Props) {
  const totalPredictions = users.reduce((sum, user) => sum + user.total_predictions, 0);
  const totalCorrect = users.reduce((sum, user) => sum + user.correct_predictions, 0);
  const averageAccuracy = totalPredictions > 0
    ? ((totalCorrect / totalPredictions) * 100).toFixed(1)
    : '0.0';

  const stats = [
    {
      label: 'Active Users',
      value: users.length.toLocaleString(),
      icon: FaUsers,
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Total Predictions',
      value: totalPredictions.toLocaleString(),
      icon: FaChartBar,
      gradient: 'from-emerald-400 to-blue-500',
    },
    {
      label: 'Average Accuracy',
      value: `${averageAccuracy}%`,
      icon: FaBullseye,
      gradient: 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md p-6 relative overflow-hidden group hover:shadow-lg transition-shadow border border-border/40"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-muted-foreground text-sm uppercase tracking-wide font-medium">
                  {stat.label}
                </h3>
                <Icon className={`text-xl bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} />
              </div>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                {stat.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
