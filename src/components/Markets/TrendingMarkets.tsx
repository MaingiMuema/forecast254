'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaFire, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

type Market = Database['public']['Tables']['markets']['Row'] & {
  total_volume?: number;
  total_yes_amount?: number;
  total_no_amount?: number;
  trades?: number;
};

const TrendingMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // First get the top 3 markets
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('*')
          .eq('status', 'open')
          .order('trades', { ascending: false })
          .limit(3);

        if (marketError) throw marketError;
        if (!marketData) return;

        // For each market, fetch its filled orders
        const marketsWithVolume = await Promise.all(
          marketData.map(async (market) => {
            // Get filled buy orders
            const { data: buyOrders, error: buyError } = await supabase
              .from('orders')
              .select('filled_amount, price, position')
              .eq('market_id', market.id)
              .eq('status', 'filled')
              .eq('side', 'buy');

            if (buyError) throw buyError;

            // Get filled sell orders
            const { data: sellOrders, error: sellError } = await supabase
              .from('orders')
              .select('filled_amount, price, position')
              .eq('market_id', market.id)
              .eq('status', 'filled')
              .eq('side', 'sell');

            if (sellError) throw sellError;

            // Calculate total volumes
            const totalBuyVolume = (buyOrders || []).reduce(
              (acc, order) => acc + ((order.filled_amount || 0) * (order.price || 0)),
              0
            );
            const totalSellVolume = (sellOrders || []).reduce(
              (acc, order) => acc + ((order.filled_amount || 0) * (order.price || 0)),
              0
            );

            // Calculate position amounts
            let totalYesAmount = 0;
            let totalNoAmount = 0;

            [...(buyOrders || []), ...(sellOrders || [])].forEach((order) => {
              const orderValue = (order.filled_amount || 0) * (order.price || 0);
              if (order.position === 'yes') {
                totalYesAmount += orderValue;
              } else {
                totalNoAmount += orderValue;
              }
            });

            return {
              ...market,
              total_volume: totalBuyVolume + totalSellVolume,
              total_yes_amount: totalYesAmount,
              total_no_amount: totalNoAmount,
              trades: (buyOrders?.length || 0) + (sellOrders?.length || 0)
            };
          })
        );

        setMarkets(marketsWithVolume);
      } catch (error) {
        console.error('Error fetching trending markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [supabase]);

  if (loading) {
    return (
      <section className="py-6 sm:py-8 px-4 md:px-6 lg:px-8 bg-[#0A0F1C]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FaFire className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-white/90">Trending Now</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#141B2D] rounded-xl p-4 sm:p-6 animate-pulse">
                <div className="h-4 bg-white/5 rounded-full w-3/4 mb-4"></div>
                <div className="h-4 bg-white/5 rounded-full w-1/2 mb-2"></div>
                <div className="h-4 bg-white/5 rounded-full w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 px-4 md:px-6 lg:px-8 bg-[#0A0F1C]">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaFire className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-white/90">Trending Now</h2>
          </div>
          <Link
            href="/markets"
            className="group flex items-center text-sm text-white/50 hover:text-white/90 transition-colors"
          >
            View all markets
            <FaArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {markets.map((market) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#141B2D] rounded-xl p-4 sm:p-6 hover:ring-2 hover:ring-white/10 transition-all hover:-translate-y-1 group"
            >
              <Link href={`/market/${market.id}`} className="block h-full">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base sm:text-lg text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                    {market.question}
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50 capitalize">{market.category}</span>
                    <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-lg">
                      {market.probability_yes > market.probability_no ? (
                        <FaArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <FaArrowDown className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <span className={market.probability_yes > market.probability_no ? 'text-emerald-500' : 'text-rose-500'}>
                        {(Math.max(market.probability_yes, market.probability_no) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                      <span className="text-white/50">Vol:</span>
                      <span className="font-medium text-white/90">
                        KES {((market.total_yes_amount || 0) + (market.total_no_amount || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                      <span className="text-white/50">Trades:</span>
                      <span className="font-medium text-white/90">{market.trades}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div
                        className={`rounded-full h-1.5 transition-all duration-300 ${
                          market.probability_yes > market.probability_no ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${market.probability_yes * 100}%` }}
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
