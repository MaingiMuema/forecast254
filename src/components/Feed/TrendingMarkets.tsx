'use client';

import { FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Link from 'next/link';

export default function TrendingMarkets() {
  const trendingMarkets = [
    {
      id: 1,
      title: 'Kenya Elections 2024',
      probability: 67,
      change: 5,
      trend: 'up',
      volume: '2.4K trades'
    },
    {
      id: 2,
      title: 'Silicon Savannah Growth',
      probability: 82,
      change: 3,
      trend: 'up',
      volume: '1.8K trades'
    },
    {
      id: 3,
      title: 'KES/USD Exchange Rate',
      probability: 45,
      change: -2,
      trend: 'down',
      volume: '3.1K trades'
    },
    {
      id: 4,
      title: 'Nairobi Housing Market',
      probability: 73,
      change: 1,
      trend: 'up',
      volume: '956 trades'
    }
  ];

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <div className="flex items-center space-x-2 mb-4">
        <FaChartLine className="text-primary" />
        <h2 className="text-lg font-semibold">Trending Markets</h2>
      </div>

      <div className="space-y-4">
        {trendingMarkets.map((market) => (
          <Link
            key={market.id}
            href={`/markets/${market.id}`}
            className="block hover:bg-accent/50 rounded-lg p-3 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{market.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">{market.volume}</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <div className="flex items-center space-x-1">
                    {market.trend === 'up' ? (
                      <FaArrowUp className="text-emerald-500 text-xs" />
                    ) : (
                      <FaArrowDown className="text-red-500 text-xs" />
                    )}
                    <span className={`text-sm font-medium ${
                      market.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {market.change}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium">{market.probability}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/markets"
        className="block mt-4 text-center text-sm text-primary hover:text-primary/80 font-medium"
      >
        View all markets
      </Link>
    </div>
  );
}
