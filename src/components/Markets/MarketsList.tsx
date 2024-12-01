'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Clock } from 'lucide-react';

type Market = Database['public']['Tables']['markets']['Row'] & {
  total_volume?: number;
  total_yes_amount?: number;
  total_no_amount?: number;
  trades?: number;
};

export default function MarketsList() {
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const category = searchParams.get('category') || 'all';
        
        // Fetch markets based on category
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('*')
          .eq('status', 'open')
          .eq(category !== 'all' ? 'category' : 'status', category !== 'all' ? category : 'open')
          .order('created_at', { ascending: false })
          .limit(20);

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
        console.error('Error fetching markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [searchParams, supabase]);

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
                {market.trades && market.trades > 10 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10">
                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[10px] font-medium text-rose-400 uppercase tracking-wider">
                      Hot
                    </span>
                  </div>
                )}
              </div>

              {/* Market Question */}
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                {market.question}
              </h3>

              {/* Market Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {market.description}
              </p>

              {/* Market Stats */}
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-muted-foreground">Volume:Ksh</span>
                    <span className="ml-1 font-medium">
                      {market.total_volume?.toFixed(0) || '0'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {market.probability_yes > market.probability_no ? (
                      <FaArrowUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <FaArrowDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={market.probability_yes > market.probability_no ? 'text-green-500' : 'text-red-500'}>
                      {(Math.max(market.probability_yes, market.probability_no) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-muted-foreground">
                    {market.closing_date 
                      ? new Date(market.closing_date).toLocaleDateString()
                      : 'No end date'}
                  </span>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${market.probability_yes * 100}%` }}
                />
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
