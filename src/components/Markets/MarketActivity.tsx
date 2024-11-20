/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { FaHistory } from 'react-icons/fa';

type TimelineFilter = '24h' | '7d' | '30d' | 'all';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: string;
  trader: string;
}

export default function MarketActivity({ marketId }: { marketId: string }) {
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>('24h');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch(`/api/market/${marketId}`);
        const data = await response.json();
        setTrades(data.recentTrades || []);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [marketId, selectedTimeline]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaHistory className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="flex items-center space-x-2">
            {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
              <div key={timeline} className="h-8 w-12 bg-gray-800 animate-pulse rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaHistory className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="flex items-center space-x-2">
          {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
            <button
              key={timeline}
              onClick={() => setSelectedTimeline(timeline)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedTimeline === timeline
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {timeline}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No recent activity</p>
          </div>
        ) : (
          trades.map((trade) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  trade.type === 'buy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                }`}>
                  {trade.type === 'buy' ? (
                    <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-rose-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {trade.type === 'buy' ? 'Buy' : 'Sell'} @ KES {trade.price}
                  </p>
                  <p className="text-xs text-gray-400">
                    by {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  KES {trade.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(trade.timestamp).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
