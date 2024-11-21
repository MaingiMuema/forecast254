'use client';

import { useState } from 'react';
import { FaSearch, FaChartLine, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Market {
  id: number;
  title: string;
  probability: string;
  trend: 'up' | 'down';
}

interface MarketSelectorProps {
  onSelect: (market: Market) => void;
  onClose: () => void;
}

export default function MarketSelector({ onSelect, onClose }: MarketSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [markets] = useState<Market[]>([
    {
      id: 1,
      title: 'Kenya Elections 2024',
      probability: '67%',
      trend: 'up'
    },
    {
      id: 2,
      title: 'Silicon Savannah Growth',
      probability: '82%',
      trend: 'up'
    },
    {
      id: 3,
      title: 'KES/USD Exchange Rate',
      probability: '45%',
      trend: 'down'
    },
    {
      id: 4,
      title: 'Nairobi Housing Market',
      probability: '73%',
      trend: 'up'
    }
  ]);

  const filteredMarkets = markets.filter(market =>
    market.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl p-4 shadow-lg border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Link a Market</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <FaTimes />
            </button>
          </div>

          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets..."
              className="w-full pl-10 pr-4 py-2 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredMarkets.map(market => (
              <button
                key={market.id}
                onClick={() => onSelect(market)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-accent/50 rounded-lg transition-colors"
              >
                <FaChartLine className="text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{market.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Current probability: {market.probability}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
