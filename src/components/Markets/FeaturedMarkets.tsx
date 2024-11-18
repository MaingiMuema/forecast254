'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChartLine, FaClock } from 'react-icons/fa';

const FeaturedMarkets = () => {
  const markets = [
    {
      id: 1,
      title: "Will William Ruto win the 2027 Presidential Election?",
      category: "Politics",
      volume: "KES 2.5M",
      probability: 65,
      endDate: "2027-08-09",
      isHot: true,
    },
    {
      id: 2,
      title: "Will Kenya Shillings hit 200 against USD in 2024?",
      category: "Economics",
      volume: "KES 1.2M",
      probability: 78,
      endDate: "2024-12-31",
      isHot: true,
    },
    {
      id: 3,
      title: "Will Safaricom 5G cover 80% of Kenya by 2025?",
      category: "Technology",
      volume: "KES 800K",
      probability: 45,
      endDate: "2025-12-31",
    },
  ];

  return (
    <section className="py-8 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Featured Markets</h2>
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
              className="bg-card rounded-lg p-6 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {market.category}
                </span>
                {market.isHot && (
                  <span className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded-full flex items-center space-x-1">
                    <FaChartLine className="w-3 h-3" />
                    <span>Hot</span>
                  </span>
                )}
              </div>

              <Link href={`/markets/${market.id}`}>
                <h3 className="text-lg font-semibold text-foreground mb-4 hover:text-primary transition-colors">
                  {market.title}
                </h3>
              </Link>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Volume</span>
                  <span className="font-medium text-foreground">{market.volume}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Probability</span>
                    <span className="font-medium text-foreground">{market.probability}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${market.probability}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FaClock className="w-4 h-4" />
                  <span>Ends {new Date(market.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedMarkets;
