'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChartLine, FaClock } from 'react-icons/fa';

interface Market {
  id: string;
  title: string;
  category: string;
  volume: string;
  probability: number;
  endDate: string;
  isHot: boolean;
}

const FeaturedMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets?type=top&limit=3');
        if (!response.ok) throw new Error('Failed to fetch markets');
        const data = await response.json();
        setMarkets(data);
      } catch (error) {
        console.error('Error fetching top markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <section className="py-8 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Top Markets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Top Markets</h2>
          <Link 
            href="/markets"
            className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors"
          >
            <span>View All Markets</span>
            <FaArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <Link href={`/markets/${market.id}`}>
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
                      <span>{new Date(market.endDate).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="ml-1 font-medium">{market.volume}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Probability:</span>
                      <span className="ml-1 font-medium">{market.probability}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedMarkets;
