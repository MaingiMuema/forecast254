'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MarketData {
  probability: number;
  volume: string;
}

export default function MarketTradingPanel({ marketId }: { marketId: string }) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [position, setPosition] = useState<'yes' | 'no'>('yes');

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await fetch(`/api/market/${marketId}`);
        const data = await response.json();
        setMarket(data);
      } catch (error) {
        console.error('Failed to fetch market:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  const handleTrade = async () => {
    if (!amount || !market) return;

    try {
      const response = await fetch('/api/markets/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          amount: parseFloat(amount),
          position,
        }),
      });

      if (!response.ok) throw new Error('Failed to execute trade');

      // Reset form and refresh market data
      setAmount('');
      const marketResponse = await fetch(`/api/markets/${marketId}`);
      const marketData = await marketResponse.json();
      setMarket(marketData);
    } catch (error) {
      console.error('Trade error:', error);
      // TODO: Show error toast
    }
  };

  if (loading || !market) {
    return <div className="h-[400px] animate-pulse bg-gray-800 rounded-lg" />;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-6">
      {/* Current Price */}
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Current Price</h3>
        <div className="text-4xl font-bold text-white">
          {market.probability}%
        </div>
        <p className="text-sm text-gray-400 mt-1">
          24h Volume: {market.volume}
        </p>
      </div>

      {/* Position Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPosition('yes')}
          className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors ${
            position === 'yes'
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <ArrowUpIcon className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">Yes</span>
          <span className="text-xs mt-1">
            {market.probability}%
          </span>
        </button>
        <button
          onClick={() => setPosition('no')}
          className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors ${
            position === 'no'
              ? 'bg-rose-500/10 text-rose-500'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <ArrowDownIcon className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">No</span>
          <span className="text-xs mt-1">
            {100 - market.probability}%
          </span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-400">
          Amount (KES)
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter amount..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-sm text-gray-400">KES</span>
          </div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {[100, 500, 1000].map((quickAmount) => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount.toString())}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            +{quickAmount}
          </button>
        ))}
      </div>

      {/* Trade Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleTrade}
        disabled={!amount}
        className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
          amount
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-gray-800 text-gray-400 cursor-not-allowed'
        }`}
      >
        {position === 'yes' ? 'Buy Yes' : 'Buy No'}
      </motion.button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        By trading, you agree to our terms and conditions.
        Make sure you understand the risks involved.
      </p>
    </div>
  );
}
