"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const CategoriesNav = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Markets", href: "/markets/all" },
    { id: "trending", label: "Trending", href: "/markets/trending" },
    { id: "sports", label: "Sports", href: "/markets/sports", hot: true },
    { id: "politics", label: "Politics", href: "/markets/politics" },
    {
      id: "entertainment",
      label: "Entertainment",
      href: "/markets/entertainment",
    },
    { id: "business", label: "Business", href: "/markets/business" },
    { id: "tech", label: "Technology", href: "/markets/tech" },
    { id: "education", label: "Education", href: "/markets/education" },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 sticky top-0 z-50 backdrop-blur-sm bg-opacity-80">
      <div className="container mx-auto px-4">
        <ul className="flex items-center space-x-1 md:space-x-2 overflow-x-auto py-2 scrollbar-hide">
          {/* Live indicator */}
          <li className="flex-shrink-0 pl-1">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-500 text-xs font-medium">
                  LIVE
                </span>
              </div>
              <div className="h-4 w-px bg-gray-700/50"></div>
            </div>
          </li>

          {/* Category links */}
          {categories.map((category) => (
            <li key={category.id} className="flex-shrink-0">
              <Link
                href={category.href}
                onClick={() => setActiveCategory(category.id)}
                className="relative group"
              >
                <div className="px-3 py-2 rounded-full text-sm transition-all duration-200 whitespace-nowrap flex items-center space-x-1.5">
                  <span
                    className={`
                    ${
                      activeCategory === category.id
                        ? "text-white font-medium"
                        : "text-gray-400 group-hover:text-gray-200"
                    }
                  `}
                  >
                    {category.label}
                  </span>
                  {category.hot && (
                    <span className="bg-red-500/10 text-red-500 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      HOT
                    </span>
                  )}
                </div>
                {activeCategory === category.id && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoriesNav;
