/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { FaChartLine, FaWallet, FaUsers } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalMarkets: number;
  activeMarkets: number;
  portfolioValue: number;
  totalOrders: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    portfolioValue: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        // Fetch stats from Supabase
        const { data: marketsData, error: marketsError } = await supabase
          .from('markets')
          .select('id, status');

        if (marketsError) throw marketsError;

        const totalMarkets = marketsData?.length || 0;
        const activeMarkets = marketsData?.filter(m => m.status === 'active').length || 0;

        // For demo purposes, using placeholder data
        setStats({
          totalMarkets,
          activeMarkets,
          portfolioValue: 25000, // Demo value
          totalOrders: 150, // Demo value
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    }

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your prediction market activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Markets"
          value={stats.totalMarkets}
          description="Total prediction markets created"
          icon={FaChartLine}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Active Markets"
          value={stats.activeMarkets}
          description="Currently active markets"
          icon={FaChartLine}
          trend="+5%"
          trendUp={true}
        />
        <StatCard
          title="Portfolio Value"
          value={stats.portfolioValue}
          description="Total value in KES"
          icon={FaWallet}
          trend="-2%"
          trendUp={false}
          valuePrefix="KES"
        />
        <StatCard
          title="Total Users"
          value={stats.totalOrders}
          description="Platform participants"
          icon={FaUsers}
          trend="+25%"
          trendUp={true}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem
            title="New Market Created"
            description="Kenya Presidential Election 2027"
            timestamp="2 hours ago"
            type="create"
          />
          <ActivityItem
            title="Position Taken"
            description="Bought YES at KES 0.65 - Tech Startup Funding Q1"
            timestamp="5 hours ago"
            type="trade"
          />
          <ActivityItem
            title="Market Resolved"
            description="Bitcoin Price Above $50k - March 2024"
            timestamp="1 day ago"
            type="resolve"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
  valuePrefix,
}: {
  title: string;
  value: number;
  description: string;
  icon: any;
  trend: string;
  trendUp: boolean;
  valuePrefix?: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {valuePrefix && <span>{valuePrefix} </span>}
            {value.toLocaleString()}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      <div className="mt-4 flex items-center">
        <span
          className={`text-sm font-medium ${
            trendUp ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {trend}
        </span>
        <span className="text-sm text-muted-foreground ml-2">vs last month</span>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  description,
  timestamp,
  type,
}: {
  title: string;
  description: string;
  timestamp: string;
  type: 'create' | 'trade' | 'resolve';
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'create':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'trade':
        return 'bg-blue-500/10 text-blue-500';
      case 'resolve':
        return 'bg-amber-500/10 text-amber-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className={`w-2 h-2 rounded-full ${getTypeStyles()}`} />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-sm text-muted-foreground">{timestamp}</p>
    </div>
  );
}
