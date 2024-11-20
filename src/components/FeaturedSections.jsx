'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const FeaturedSections = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets?type=featured&limit=4');
        if (!response.ok) throw new Error('Failed to fetch markets');
        const data = await response.json();
        setMarkets(data);
      } catch (error) {
        console.error('Error fetching featured markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  const getTheme = (index) => {
    const themes = [
      {
        bg: 'bg-[#0A0F1C]',
        accent: 'from-cyan-500 to-blue-600',
        ring: 'group-hover:ring-cyan-500/20',
        dot: 'bg-cyan-500',
        text: 'group-hover:text-cyan-400'
      },
      {
        bg: 'bg-[#120F1C]',
        accent: 'from-fuchsia-500 to-purple-600',
        ring: 'group-hover:ring-fuchsia-500/20',
        dot: 'bg-fuchsia-500',
        text: 'group-hover:text-fuchsia-400'
      },
      {
        bg: 'bg-[#1C0F0F]',
        accent: 'from-rose-500 to-red-600',
        ring: 'group-hover:ring-rose-500/20',
        dot: 'bg-rose-500',
        text: 'group-hover:text-rose-400'
      },
      {
        bg: 'bg-[#0F1C14]',
        accent: 'from-emerald-500 to-green-600',
        ring: 'group-hover:ring-emerald-500/20',
        dot: 'bg-emerald-500',
        text: 'group-hover:text-emerald-400'
      }
    ];
    return themes[index % themes.length];
  };

  const truncateText = (text, length) => {
    return text.length > length ? text.substring(0, length) + '...' : text.padEnd(length, ' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[260px] bg-[#0A0F1C] rounded-2xl p-6 animate-pulse">
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
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {markets.map((market, index) => {
          const theme = getTheme(index);
          return (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/markets/${market.id}`}>
                <div
                  className={`
                    relative h-[260px] rounded-2xl ${theme.bg}
                    ring-1 ring-white/10
                    ${theme.ring}
                    hover:ring-2
                    group
                    transition-all duration-500
                    hover:-translate-y-1
                    overflow-hidden
                  `}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 opacity-50 mix-blend-overlay">
                    <div className={`absolute inset-0 opacity-25 bg-gradient-to-br ${theme.accent}`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(255,255,255,0.1),transparent_70%)]" />
                  </div>

                  {/* Content wrapper */}
                  <div className="relative h-full p-6 flex flex-col">
                    {/* Top section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-1 w-1 rounded-full ${theme.dot}`} />
                        <span className="text-[10px] font-medium tracking-wider text-white/40 uppercase">
                          Featured
                        </span>
                      </div>
                      {market.isHot && (
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-2 py-1 rounded-full ring-1 ring-white/10">
                          <span className={`w-1 h-1 rounded-full ${theme.dot} animate-pulse`} />
                          <span className="text-[10px] font-medium tracking-wider text-white/70">LIVE</span>
                        </div>
                      )}
                    </div>

                    {/* Title and description */}
                    <div className="space-y-3 mb-6">
                      <h3 className={`text-lg font-semibold text-white/90 ${theme.text} transition-colors duration-300 line-clamp-2 min-h-[3.5rem]`}>
                        {market.title}
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                        {truncateText(market.description, 120)}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="mt-auto">
                      <button
                        className={`
                          w-full px-4 py-2.5 rounded-xl text-xs font-medium
                          bg-gradient-to-r ${theme.accent}
                          text-white/90
                          transition-all duration-300
                          hover:shadow-lg hover:shadow-white/10
                          flex items-center justify-center gap-2
                          group-hover:gap-3
                        `}
                      >
                        Trade Now
                        <svg 
                          className="w-3.5 h-3.5 transition-transform duration-300" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M17 8l4 4m0 0l-4 4m4-4H3" 
                          />
                        </svg>
                      </button>
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
