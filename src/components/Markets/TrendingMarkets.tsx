'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaFire, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const TrendingMarkets = () => {
  const markets = [
    {
      id: 1,
      title: "Will Kenya win AFCON 2025?",
      category: "Sports",
      volume: "KES 5M",
      probability: 35,
      change: 12,
      trades: 234,
    },
    {
      id: 2,
      title: "Will Nairobi hit 10M population by 2025?",
      category: "Demographics",
      volume: "KES 2.1M",
      probability: 82,
      change: -5,
      trades: 156,
    },
    {
      id: 3,
      title: "Will Kenya Airways return to profitability in 2024?",
      category: "Business",
      volume: "KES 3.2M",
      probability: 28,
      change: 8,
      trades: 198,
    },
  ];

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

        <div className="space-y-4">
          {markets.map((market) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {market.category}
                    </span>
                    <div className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
                      market.change > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {market.change > 0 ? <FaArrowUp className="w-3 h-3" /> : <FaArrowDown className="w-3 h-3" />}
                      <span>{Math.abs(market.change)}%</span>
                    </div>
                  </div>
                  <Link href={`/markets/${market.id}`}>
                    <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                      {market.title}
                    </h3>
                  </Link>
                </div>

                <div className="flex flex-col items-end ml-4 space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{market.probability}%</span> probability
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{market.trades}</span> trades
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {market.volume}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingMarkets;
