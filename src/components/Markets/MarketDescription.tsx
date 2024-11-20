'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, ScaleIcon } from '@heroicons/react/24/outline';

interface MarketData {
  description: string;
  resolutionCriteria: string;
}

export default function MarketDescription({ marketId }: { marketId: string }) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'resolution'>('description');

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

  if (loading || !market) {
    return <div className="h-64 animate-pulse bg-gray-800 rounded-lg" />;
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('description')}
          className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'description'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DocumentTextIcon className="h-5 w-5" />
          <span>Description</span>
        </button>
        <button
          onClick={() => setActiveTab('resolution')}
          className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'resolution'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ScaleIcon className="h-5 w-5" />
          <span>Resolution Criteria</span>
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-6"
      >
        {activeTab === 'description' ? (
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {market.description}
            </p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {market.resolutionCriteria}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
