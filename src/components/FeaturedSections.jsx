"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const FeaturedSections = () => {
  const featuredItems = [
    {
      id: 1,
      title: "Trump won, now what?",
      href: "/trump",
      prompt:
        "donald trump victory celebration, dark moody lighting, professional news photography, dramatic",
      buttonText: "View Market",
      gradient: "from-orange-600/10 via-orange-500/5 to-red-500/10",
      description: "Explore market implications",
    },
    {
      id: 2,
      title: "2024 Election Results",
      href: "/elections",
      prompt:
        "US election 2024, american flags, dark dramatic photojournalistic style, moody lighting",
      buttonText: "Trade Now",
      gradient: "from-blue-600/10 via-blue-500/5 to-purple-500/10",
      hot: true,
      description: "Predict the outcome",
    },
    {
      id: 3,
      title: "Mention Markets",
      href: "/mentions",
      prompt:
        "social media trends visualization, dark tech aesthetic, glowing elements, cyberpunk style",
      buttonText: "Explore",
      gradient: "from-emerald-600/10 via-emerald-500/5 to-teal-500/10",
      description: "What will they say?",
    },
    {
      id: 4,
      title: "Start Trading Today",
      href: "/",
      prompt:
        "financial trading visualization, dark modern office, blue holographic displays, futuristic",
      buttonText: "Get Started",
      gradient: "from-purple-600/10 via-purple-500/5 to-pink-500/10",
      cta: true,
      description: "Join thousands of traders",
    },
  ];

  // Function to generate Pollinations.ai URL with proper encoding
  const getPollinationsUrl = (prompt) => {
    const encodedPrompt = encodeURIComponent(
      prompt + ", dark theme, high quality"
    );
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: item.id * 0.1 }}
          >
            <Link href={item.href}>
              <div
                className={`
                relative h-[180px] rounded-xl overflow-hidden
                bg-gradient-to-br ${item.gradient}
                border border-gray-800/50
                hover:border-gray-700/50 hover:shadow-lg
                hover:shadow-${item.gradient.split("-")[1]}/5
                transition-all duration-300 group
                backdrop-blur-sm bg-gray-900/90
              `}
              >
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                  <Image
                    src={getPollinationsUrl(item.prompt)}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="relative h-full p-4 flex flex-col justify-between z-10">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      {item.hot && (
                        <span className="bg-red-500/10 text-red-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                          HOT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>

                  <button
                    className={`
                    mt-auto w-full px-3 py-2 rounded-lg text-xs font-medium
                    transition-all duration-200 flex items-center justify-center
                    ${
                      item.cta
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                        : "bg-gray-800/50 text-gray-200 hover:bg-gray-700/50"
                    }
                  `}
                  >
                    {item.buttonText}
                  </button>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSections;
