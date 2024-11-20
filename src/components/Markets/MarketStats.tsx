'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface MarketStats {
  total_trades: number;
  total_volume: number;
  unique_traders: number;
}

export default function MarketStats({ marketId }: { marketId: string }) {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/market/${marketId}`);
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch market stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [marketId]);

  if (loading || !stats) {
    return <div className="h-[300px] animate-pulse bg-gray-800 rounded-lg" />;
  }

  const statItems = [
    {
      label: 'Total Volume',
      value: `KES ${stats.total_volume.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Trades',
      value: stats.total_trades.toLocaleString(),
      icon: CurrencyDollarIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Unique Traders',
      value: stats.unique_traders.toLocaleString(),
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
