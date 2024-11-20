'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaFire, FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface Market {
  id: string;
  title: string;
  category: string;
  volume: string;
  probability: number;
  change: number;
  trades: number;
}

const TrendingMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets?type=trending&limit=3');
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
      <section className="py-8 px-4 md:px-6 lg:px-8 bg-accent/5">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FaFire className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
            </div>
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
    <section className="py-8 px-4 md:px-6 lg:px-8 bg-accent/5">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaFire className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
          </div>
          <Link 
            href="/markets/trending"
            className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors"
          >
            <span>See More</span>
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
              <Link href={`/market/${market.id}`}>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                    {market.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{market.category}</span>
                    <div className="flex items-center space-x-2">
                      {market.change > 0 ? (
                        <FaArrowUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <FaArrowDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={market.change > 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(market.change)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="ml-1 font-medium">{market.volume}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trades:</span>
                      <span className="ml-1 font-medium">{market.trades}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${market.probability}%` }}
                      />
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

export default TrendingMarkets;
