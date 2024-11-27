/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChartLine, FaClock, FaArrowUp, FaArrowDown, FaFire, FaChartBar } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

type Market = Database['public']['Tables']['markets']['Row'] & {
  total_volume?: number;
  total_yes_amount?: number;
  total_no_amount?: number;
  trades?: number;
};

const FeaturedMarkets = () => {
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
        console.error('Error fetching top markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [supabase]);

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <FaChartBar className="w-8 h-8 text-rose-500" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                Featured Markets
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-muted rounded-lg w-3/4 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded-lg w-full"></div>
                  <div className="h-4 bg-muted rounded-lg w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaChartBar className="w-8 h-8 text-rose-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              Featured Markets
            </h2>
          </div>
          <Link 
            href="/markets"
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-medium hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-300"
          >
            <span>Explore Markets</span>
            <FaArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-3">
          {markets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={`/market/${market.id}`}>
                <div className="group relative h-full bg-card hover:bg-accent/5 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5">
                  {/* Market Status and Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10">
                      <FaChartLine className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        {market.category}
                      </span>
                    </div>
                    {market.trades && market.trades > 10 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">
                          Trending
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Market Question */}
                  <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {market.question}
                  </h3>

                  {/* Market Description */}
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                    {market.description}
                  </p>

                  {/* Market Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-accent/5 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground mb-1">Volume</div>
                      <div className="font-bold text-foreground">
                        {market.total_volume?.toFixed(0) || '0'}
                      </div>
                    </div>
                    <div className="bg-accent/5 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground mb-1">Trades</div>
                      <div className="font-bold text-foreground">
                        {market.trades || '0'}
                      </div>
                    </div>
                    <div className="bg-accent/5 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground mb-1">Ends</div>
                      <div className="font-bold text-foreground">
                        {new Date(market.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {market.probability_yes > market.probability_no ? (
                          <FaArrowUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <FaArrowDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={market.probability_yes > market.probability_no ? 'text-green-500' : 'text-red-500'}>
                          {(Math.max(market.probability_yes, market.probability_no) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-muted-foreground font-medium">
                        Probability
                      </span>
                    </div>
                    <div className="w-full h-2 bg-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300"
                        style={{ width: `${market.probability_yes * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-accent/10 group-hover:ring-primary/20 transition-all duration-300"></div>
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
