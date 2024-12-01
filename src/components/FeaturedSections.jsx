"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const FeaturedSections = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch("/api/markets?type=featured&limit=4");
        if (!response.ok) throw new Error("Failed to fetch markets");
        const marketData = await response.json();

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

            const totalVolume = totalBuyVolume + totalSellVolume;
            const tradeCount = (buyOrders?.length || 0) + (sellOrders?.length || 0);

            return {
              ...market,
              volume: `KES ${totalVolume.toLocaleString()}`,
              trades: tradeCount
            };
          })
        );

        setMarkets(marketsWithVolume);
      } catch (error) {
        console.error("Error fetching featured markets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [supabase]);

  const getTheme = (index) => {
    const themes = [
      {
        bg: "bg-[#0A0F1C]",
        accent: "from-cyan-500 to-blue-600",
        ring: "group-hover:ring-cyan-500/20",
        dot: "bg-cyan-500",
        text: "group-hover:text-cyan-400",
      },
      {
        bg: "bg-[#120F1C]",
        accent: "from-fuchsia-500 to-purple-600",
        ring: "group-hover:ring-fuchsia-500/20",
        dot: "bg-fuchsia-500",
        text: "group-hover:text-fuchsia-400",
      },
      {
        bg: "bg-[#1C0F0F]",
        accent: "from-rose-500 to-red-600",
        ring: "group-hover:ring-rose-500/20",
        dot: "bg-rose-500",
        text: "group-hover:text-rose-400",
      },
      {
        bg: "bg-[#0F1C14]",
        accent: "from-emerald-500 to-green-600",
        ring: "group-hover:ring-emerald-500/20",
        dot: "bg-emerald-500",
        text: "group-hover:text-emerald-400",
      },
    ];
    return themes[index % themes.length];
  };

  const truncateText = (text, length) => {
    return text.length > length
      ? text.substring(0, length) + "..."
      : text.padEnd(length, " ");
  };

  const CircularProgress = ({ probability, theme }) => {
    const circumference = 2 * Math.PI * 24;
    const strokeDashoffset = circumference - (probability / 100) * circumference;
    const probabilityColor = probability >= 50 ? theme.accent.split(' ')[1] : theme.accent.split(' ')[0];

    return (
      <div className="relative flex flex-col items-center">
        <div className="relative w-16 h-16">
          <svg 
            className="w-16 h-16" 
            viewBox="0 0 64 64"
          >
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-white/5"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke={probabilityColor.replace('to-', '').replace('from-', '')}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              transform="rotate(-90 32 32)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{Math.round(probability)}%</span>
          </div>
        </div>
        <span className="mt-2 text-xs font-medium text-white/50">Yes Prob.</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[280px] sm:h-[300px] bg-[#0A0F1C] rounded-2xl p-6 animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-2 w-12 bg-gray-800 rounded-full"></div>
                <div className="h-6 w-3/4 bg-gray-800 rounded-full"></div>
                <div className="h-4 w-full bg-gray-800 rounded-full"></div>
                <div className="h-4 w-2/3 bg-gray-800 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {markets.map((market, index) => {
          const theme = getTheme(index);
          return (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/market/${market.id}`}>
                <div
                  className={`
                    relative min-h-[280px] h-full rounded-2xl ${theme.bg}
                    ring-1 ring-white/10
                    ${theme.ring}
                    group
                    transition-all duration-500
                    hover:-translate-y-2
                    hover:shadow-2xl hover:shadow-black/30
                    overflow-hidden
                    cursor-pointer
                    flex flex-col
                  `}
                >
                  {/* Background gradient with improved effects */}
                  <div className="absolute inset-0 opacity-60 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-75">
                    <div
                      className={`absolute inset-0 opacity-25 bg-gradient-to-br ${theme.accent}`}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(255,255,255,0.15),transparent_70%)] group-hover:bg-[radial-gradient(circle_at_30%_-20%,rgba(255,255,255,0.2),transparent_70%)] transition-all duration-500" />
                  </div>

                  {/* Content wrapper with improved spacing */}
                  <div className="relative p-4 sm:p-6 flex flex-col h-full">
                    {/* Top section */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-500">
                        <div className={`h-1.5 w-1.5 rounded-full ${theme.dot} group-hover:scale-125 transition-transform duration-500`} />
                        <span className="text-[10px] font-medium tracking-wider text-white/40 uppercase group-hover:text-white/60 transition-colors duration-300">
                          Featured
                        </span>
                      </div>
                      {market.isHot && (
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-2.5 py-1.5 rounded-full ring-1 ring-white/10 group-hover:bg-white/10 transition-colors duration-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`} />
                          <span className="text-[10px] font-medium tracking-wider text-white/70 group-hover:text-white/90">
                            LIVE
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title and description with improved typography */}
                    <div className="flex-grow space-y-2">
                      <h3
                        className={`text-base sm:text-lg font-semibold text-white/90 ${theme.text} transition-all duration-300 line-clamp-2 group-hover:translate-x-1`}
                      >
                        {market.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/50 leading-relaxed line-clamp-3 group-hover:text-white/60 transition-colors duration-300">
                        {truncateText(market.description, 120)}
                      </p>
                    </div>

                    {/* Market stats with improved layout */}
                    <div className="flex items-end justify-between mt-4 sm:mt-6">
                      <CircularProgress probability={market.probability || 0} theme={theme} />
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all duration-300 group-hover:-translate-y-1 hover:ring-1 hover:ring-white/20">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium text-white/90">{market.volume || "KES 0"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all duration-300 group-hover:-translate-y-1 delay-75 hover:ring-1 hover:ring-white/20">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium text-white/90">{market.trades || 0} Trades</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedSections;
