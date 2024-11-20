'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useSearchParams } from 'next/navigation';

const CategoriesNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryCounts, setCategoryCounts] = useState({});

  const categories = [
    { id: "all", label: "All Markets", href: "/markets" },
    { id: "trending", label: "Trending", href: "/markets?category=trending" },
    { id: "sports", label: "Sports", href: "/markets?category=sports" },
    { id: "politics", label: "Politics", href: "/markets?category=politics", hot: true },
    {
      id: "entertainment",
      label: "Entertainment",
      href: "/markets?category=entertainment",
    },
    { id: "business", label: "Business", href: "/markets?category=business" },
    { id: "tech", label: "Technology", href: "/markets?category=tech" },
    { id: "education", label: "Education", href: "/markets?category=education" },
  ];

  useEffect(() => {
    const category = searchParams.get('category') || 'all';
    setActiveCategory(category);

    const fetchCategoryCounts = async () => {
      try {
        const response = await fetch('/api/markets/categories');
        if (response.ok) {
          const data = await response.json();
          setCategoryCounts(data);
        }
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    };

    fetchCategoryCounts();
  }, [searchParams]);

  const showCounts = pathname === '/markets';

  return (
    <div className="bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Live Markets Indicator */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-500 text-xs font-medium tracking-wide">
                LIVE MARKETS
              </span>
            </div>
            <div className="hidden md:block h-6 w-px bg-white/5"></div>
          </div>

          {/* Market Stats - Can be added later */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">24h Volume:</span>
              <span className="text-sm font-medium text-white">KES 1.2M</span>
            </div>
            <div className="h-6 w-px bg-white/5"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Active Markets:</span>
              <span className="text-sm font-medium text-white">{categoryCounts.all || 0}</span>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                className="flex-shrink-0"
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={category.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-full
                    text-sm font-medium transition-all duration-200
                    ${activeCategory === category.id
                      ? 'text-primary-foreground dark:text-white'
                      : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
                    }
                  `}
                >
                  <span className="relative z-10">{category.label}</span>
                  
                  {showCounts && categoryCounts[category.id] && (
                    <span className={`
                      relative z-10 text-xs px-2 py-0.5 rounded-full
                      ${activeCategory === category.id
                        ? 'bg-primary/10 text-primary-foreground dark:bg-white/10 dark:text-white'
                        : 'bg-muted text-muted-foreground dark:bg-white/5 dark:text-gray-400'
                      }
                    `}>
                      {categoryCounts[category.id]}
                    </span>
                  )}
                  
                  {category.hot && (
                    <span className="relative z-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}

                  {activeCategory === category.id && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-primary/10 dark:bg-white/5 rounded-full ring-1 ring-primary/20 dark:ring-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                        duration: 0.2
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesNav;
