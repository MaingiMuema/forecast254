'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useSearchParams } from 'next/navigation';
import { FaSearch, FaTimes } from "react-icons/fa";

const CategoriesNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const categories = [
    { id: "all", label: "All Markets", href: "/markets" },
    //{ id: "trending", label: "Trending", href: "/markets?category=trending" },
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          
          if (response.ok) {
            setSearchResults(data.markets);
            setShowResults(true);
          } else {
            console.error('Search error:', data.error);
          }
        } catch (error) {
          console.error('Failed to fetch search results:', error);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showCounts = pathname === '/markets';

  return (
    <div className="sticky top-[15px] z-40 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto">
        {/* Live Markets Indicator */}
        <div className="px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
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

            {/* Market Stats - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">24h Volume:</span>
                <span className="text-sm font-medium text-foreground">KES 1.2M</span>
              </div>
              <div className="h-6 w-px bg-white/5"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active Markets:</span>
                <span className="text-sm font-medium text-foreground">{categoryCounts.all || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets..."
                className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FaSearch className="text-muted-foreground text-sm" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center"
                >
                  <FaTimes className="text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="absolute z-50 w-full mt-2 bg-background/95 backdrop-blur-xl border border-border rounded-lg shadow-lg">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((market) => (
                      <Link
                        key={market.id}
                        href={`/market/${market.id}`}
                        className="block px-4 py-2 hover:bg-white/5 transition-colors"
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="text-sm font-medium">{market.title}</div>
                        <div className="text-xs text-muted-foreground">{market.category}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Categories List */}
        <div className="-mx-3 sm:mx-2">
          <div className="flex items-center gap-2 p-2 mx-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                className="flex-shrink-0"
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={category.href}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    text-xs font-medium transition-all duration-200
                    ${activeCategory === category.id
                      ? 'text-primary dark:text-white'
                      : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
                    }
                  `}
                >
                  <span className="relative z-10">{category.label}</span>
                  
                  {showCounts && categoryCounts[category.id] && (
                    <span className={`
                      relative z-10 text-[10px] px-1.5 py-0.5 rounded-full
                      ${activeCategory === category.id
                        ? 'bg-primary/20 text-primary dark:bg-white/10 dark:text-white'
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
                      className="absolute inset-0 bg-primary/20 dark:bg-white/5 rounded-full ring-1 ring-primary/30 dark:ring-white/10"
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
