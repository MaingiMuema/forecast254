'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaClock, FaFireAlt } from 'react-icons/fa';
import Link from 'next/link';

interface Market {
  id: string;
  title: string;
  category: string;
  volume: string;
  probability: number;
  endDate: string;
  isHot: boolean;
  trendingScore?: number;
}

export default function TrendingMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets?type=trending&limit=12');
        if (!response.ok) throw new Error('Failed to fetch markets');
        const data = await response.json();
        setMarkets(data);
      } catch (error) {
        console.error('Error fetching trending markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
        <div className="flex items-center space-x-2 mb-8">
          <FaFireAlt className="w-8 h-8 text-red-500" />
          <h1 className="text-4xl font-bold text-foreground">Trending Markets</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="flex items-center space-x-2 mb-8">
        <FaFireAlt className="w-8 h-8 text-red-500" />
        <h1 className="text-4xl font-bold text-foreground">Trending Markets</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {markets.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-card rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <Link href={`/market/${market.id}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                    {market.title}
                  </h3>
                  {market.trendingScore && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <FaFireAlt className="w-3 h-3" />
                      <span>{market.trendingScore}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <FaChartLine className="w-4 h-4" />
                    <span>{market.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FaClock className="w-4 h-4" />
                    <span>{market.endDate}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Volume: {market.volume}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(market.probability * 100)}%
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
