'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChartBar, FaClock, FaHistory } from 'react-icons/fa';

type TimelineFilter = '24h' | '7d' | '30d' | 'all';

const MarketActivity = () => {
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>('24h');

  const recentActivity = [
    {
      id: 1,
      title: "Kenya Tech Hub Growth",
      action: "New position",
      user: "James K.",
      amount: "KES 50K",
      timestamp: "2 minutes ago",
    },
    {
      id: 2,
      title: "Mombasa Port Expansion",
      action: "Market resolved",
      user: "System",
      amount: "KES 2.1M",
      timestamp: "15 minutes ago",
    },
    {
      id: 3,
      title: "KCB Group Merger",
      action: "Price change",
      user: "Sarah M.",
      amount: "KES 75K",
      timestamp: "32 minutes ago",
    },
    {
      id: 4,
      title: "East African Railway",
      action: "New comment",
      user: "David O.",
      timestamp: "1 hour ago",
    },
  ];

  const volumeData = {
    '24h': [
      {
        id: 1,
        title: "Kenya Oil Production Start",
        volume: "KES 12.5M",
        probability: 72,
        change24h: "+5.2%",
      },
      {
        id: 2,
        title: "Nairobi Stock Exchange Performance",
        volume: "KES 8.3M",
        probability: 45,
        change24h: "-2.8%",
      },
      {
        id: 3,
        title: "Digital Currency Adoption",
        volume: "KES 6.7M",
        probability: 63,
        change24h: "+1.4%",
      },
      {
        id: 4,
        title: "Agricultural Export Growth",
        volume: "KES 5.9M",
        probability: 58,
        change24h: "+0.8%",
      },
    ],
    '7d': [
      {
        id: 1,
        title: "Kenya Oil Production Start",
        volume: "KES 82.5M",
        probability: 75,
        change24h: "+12.2%",
      },
      {
        id: 2,
        title: "East African Community Integration",
        volume: "KES 65.3M",
        probability: 52,
        change24h: "+8.5%",
      },
      {
        id: 3,
        title: "Nairobi Stock Exchange Performance",
        volume: "KES 45.7M",
        probability: 48,
        change24h: "-5.8%",
      },
      {
        id: 4,
        title: "Digital Currency Adoption",
        volume: "KES 38.2M",
        probability: 67,
        change24h: "+3.4%",
      },
    ],
    '30d': [
      {
        id: 1,
        title: "Kenya Oil Production Start",
        volume: "KES 325.5M",
        probability: 78,
        change24h: "+25.2%",
      },
      {
        id: 2,
        title: "East African Community Integration",
        volume: "KES 245.3M",
        probability: 55,
        change24h: "+15.5%",
      },
      {
        id: 3,
        title: "Mombasa Port Expansion",
        volume: "KES 198.7M",
        probability: 82,
        change24h: "+18.4%",
      },
      {
        id: 4,
        title: "Digital Currency Adoption",
        volume: "KES 156.2M",
        probability: 70,
        change24h: "+10.4%",
      },
    ],
    'all': [
      {
        id: 1,
        title: "Kenya Oil Production Start",
        volume: "KES 1.2B",
        probability: 80,
        change24h: "+45.2%",
      },
      {
        id: 2,
        title: "East African Community Integration",
        volume: "KES 856.3M",
        probability: 58,
        change24h: "+28.5%",
      },
      {
        id: 3,
        title: "Mombasa Port Expansion",
        volume: "KES 725.7M",
        probability: 85,
        change24h: "+32.4%",
      },
      {
        id: 4,
        title: "Digital Currency Adoption",
        volume: "KES 512.2M",
        probability: 73,
        change24h: "+22.4%",
      },
    ],
  };

  const timelineFilters: { value: TimelineFilter; label: string }[] = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <section className="py-8 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-lg border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FaHistory className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
              </div>
              <Link 
                href="/activity"
                className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors text-sm"
              >
                <span>View All</span>
                <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <Link href={`/markets/${item.id}`} className="text-foreground hover:text-primary transition-colors">
                      <h3 className="font-medium mb-1">{item.title}</h3>
                    </Link>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{item.action}</span>
                      <span>•</span>
                      <span>{item.user}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-sm">
                    {item.amount && (
                      <span className="font-medium text-foreground">{item.amount}</span>
                    )}
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <FaClock className="w-3 h-3" />
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Volume */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card rounded-lg border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FaChartBar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Top Volume</h2>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-accent/10 rounded-lg p-1">
                  {timelineFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedTimeline(filter.value)}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        selectedTimeline === filter.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <Link 
                  href="/markets/top"
                  className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors text-sm"
                >
                  <span>View All</span>
                  <FaArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {volumeData[selectedTimeline].map((market) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <Link href={`/markets/${market.id}`} className="text-foreground hover:text-primary transition-colors">
                      <h3 className="font-medium mb-1">{market.title}</h3>
                    </Link>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">{market.probability}% probability</span>
                      <span>•</span>
                      <span className={market.change24h.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                        {market.change24h}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">{market.volume}</span>
                    <div className="text-xs text-muted-foreground">{selectedTimeline} volume</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MarketActivity;
