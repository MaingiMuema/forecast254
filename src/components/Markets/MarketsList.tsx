'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  volume: string;
  probability: number;
  endDate: string;
  isHot: boolean;
}

export default function MarketsList() {
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const category = searchParams.get('category') || 'all';
        const response = await fetch(`/api/markets?category=${category}&limit=20`);
        if (!response.ok) throw new Error('Failed to fetch markets');
        const data = await response.json();
        setMarkets(data);
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market, index) => (
        <motion.div
          key={market.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Link href={`/market/${market.id}`}>
            <div className="group relative bg-card hover:bg-card/80 rounded-xl p-6 transition-all duration-200">
              {/* Market Status */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {market.category}
                </span>
                {market.isHot && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10">
                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[10px] font-medium text-rose-400 uppercase tracking-wider">
                      Hot
                    </span>
                  </div>
                )}
              </div>

              {/* Market Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                {market.title}
              </h3>

              {/* Market Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {market.description}
              </p>

              {/* Market Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-medium">
                    {market.volume}
                  </span>
                  <span className="text-foreground font-medium">
                    {market.probability}%
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(market.endDate).toLocaleDateString()}
                </span>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all duration-200"></div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
