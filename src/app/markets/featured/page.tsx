'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaClock } from 'react-icons/fa';
import Link from 'next/link';

interface Market {
  id: string;
  title: string;
  category: string;
  volume: string;
  probability: number;
  endDate: string;
  isHot: boolean;
}

export default function FeaturedMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets?type=top&limit=12');
        if (!response.ok) throw new Error('Failed to fetch markets');
        const data = await response.json();
        setMarkets(data);
      } catch (error) {
        console.error('Error fetching featured markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Featured Markets</h1>
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
      <h1 className="text-4xl font-bold text-foreground mb-8">Featured Markets</h1>
      
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
                  {market.isHot && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Hot
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
                  <span className={`text-sm font-medium ${market.probability >= 10 ? 'text-green-500' : 'text-primary'}`}>
                    {market.probability}%
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
