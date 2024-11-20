'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { FaHistory } from 'react-icons/fa';
import Link from 'next/link';

type TimelineFilter = '24h' | '7d' | '30d' | 'all';
type ActivityType = 'all' | 'trades' | 'liquidity' | 'resolutions' | 'recent';

interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'add_liquidity' | 'remove_liquidity' | 'resolution' | 'new_trade';
  amount: number;
  price?: number;
  timestamp: string;
  trader: string;
  marketId: string;
  marketTitle: string;
  outcomeIndex?: number;
  description?: string;
  category?: string;
  endDate?: string;
}

export default function OverallActivity() {
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>('24h');
  const [selectedType, setSelectedType] = useState<ActivityType>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activity?timeline=${selectedTimeline}&type=${selectedType}`);
        const data = await response.json();
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [selectedTimeline, selectedType]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-card rounded-xl p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FaHistory className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Market Activity</h2>
            </div>
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex flex-wrap gap-2">
                {(['all', 'trades', 'liquidity', 'resolutions', 'recent'] as ActivityType[]).map((type) => (
                  <div key={type} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
                ))}
              </div>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="flex flex-wrap gap-2">
                {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
                  <div key={timeline} className="h-8 w-12 bg-muted animate-pulse rounded-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'buy':
        return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />;
      case 'sell':
        return <ArrowDownIcon className="h-4 w-4 text-rose-500" />;
      case 'add_liquidity':
        return <ArrowUpIcon className="h-4 w-4 text-blue-500" />;
      case 'remove_liquidity':
        return <ArrowDownIcon className="h-4 w-4 text-orange-500" />;
      case 'resolution':
        return <ArrowUpIcon className="h-4 w-4 text-purple-500" />;
      case 'new_trade':
        return <ChartBarIcon className="h-4 w-4 text-indigo-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'buy':
        return 'bg-emerald-500/10';
      case 'sell':
        return 'bg-rose-500/10';
      case 'add_liquidity':
        return 'bg-blue-500/10';
      case 'remove_liquidity':
        return 'bg-orange-500/10';
      case 'resolution':
        return 'bg-purple-500/10';
      case 'new_trade':
        return 'bg-indigo-500/10';
    }
  };

  const getActivityLabel = (activity: Activity) => {
    switch (activity.type) {
      case 'buy':
        return `Buy @ KES ${activity.price}`;
      case 'sell':
        return `Sell @ KES ${activity.price}`;
      case 'add_liquidity':
        return 'Added Liquidity';
      case 'remove_liquidity':
        return 'Removed Liquidity';
      case 'resolution':
        return `Market Resolved${activity.outcomeIndex !== undefined ? ` (Outcome ${activity.outcomeIndex})` : ''}`;
      case 'new_trade':
        return 'New Market Added';
    }
  };

  const renderActivityContent = (activity: Activity) => {
    if (activity.type === 'new_trade') {
      return (
        <>
          <Link
            href={`/market/${activity.marketId}`}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {activity.marketTitle}
          </Link>
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded-full">
                {activity.category}
              </span>
              <span className="text-xs text-muted-foreground">
                Ends {new Date(activity.endDate || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Link
          href={`/market/${activity.marketId}`}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {activity.marketTitle}
        </Link>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">
            {getActivityLabel(activity)}
          </p>
          <span className="text-xs text-muted-foreground">•</span>
          <p className="text-xs text-muted-foreground">
            by {activity.trader.slice(0, 6)}...{activity.trader.slice(-4)}
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="bg-card rounded-xl p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaHistory className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Market Activity</h2>
          </div>
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'trades', 'liquidity', 'resolutions', 'recent'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                    selectedType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <div className="flex flex-wrap gap-2">
              {(['24h', '7d', '30d', 'all'] as TimelineFilter[]).map((timeline) => (
                <button
                  key={timeline}
                  onClick={() => setSelectedTimeline(timeline)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none ${
                    selectedTimeline === timeline
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {timeline}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-muted/50 rounded-lg p-3 sm:p-4 ${
                  activity.type === 'new_trade' ? 'border border-indigo-500/10' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)} shrink-0`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renderActivityContent(activity)}
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-11 sm:pl-0 sm:ml-4">
                    {activity.type !== 'new_trade' && (
                      <p className="text-sm font-medium text-foreground">
                        KES {activity.amount.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}