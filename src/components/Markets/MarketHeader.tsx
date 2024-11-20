'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ChartBarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface MarketData {
  id: string;
  question: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  status: string;
  creator_id: string;
  resolved_value?: number;
  stats?: {
    total_trades: number;
    total_volume: number;
    unique_traders: number;
  };
}

export default function MarketHeader({ marketId }: { marketId: string }) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await fetch(`/api/market/${marketId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }
        const data = await response.json();
        if (!data) {
          throw new Error('No market data received');
        }
        setMarket(data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch market:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  if (loading) {
    return <div className="h-48 animate-pulse bg-gray-800 rounded-lg" />;
  }

  if (error || !market) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="text-center text-red-400">
          <p>{error || 'Failed to load market data'}</p>
        </div>
      </div>
    );
  }

  const timeLeft = new Date(market.end_date).getTime() - new Date().getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      {/* Category and Stats */}
      <div className="flex items-center justify-between">
        <Link
          href={`/markets?category=${market.category ? market.category.toLowerCase() : 'all'}`}
          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          {market.category || 'Uncategorized'}
        </Link>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <UserGroupIcon className="h-4 w-4" />
            <span>{market.stats?.unique_traders || 0} traders</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChartBarIcon className="h-4 w-4" />
            <span>{market.stats?.total_trades || 0} trades</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">{market.question}</h1>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
            <span className="text-sm text-gray-400">Volume</span>
          </div>
          <span className="text-sm font-medium text-white">
            KES {(market.stats?.total_volume || 0).toLocaleString()}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-primary" />
            <span className="text-sm text-gray-400">Probability</span>
          </div>
          <span className="text-sm font-medium text-white">
            {market.resolved_value ? `${(market.resolved_value * 100).toFixed(1)}%` : 'Unresolved'}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-primary" />
            <span className="text-sm text-gray-400">Time Left</span>
          </div>
          <span className="text-sm font-medium text-white">{daysLeft} days</span>
        </motion.div>
      </div>
    </div>
  );
}
