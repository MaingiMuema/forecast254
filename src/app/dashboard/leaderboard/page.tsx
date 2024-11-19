/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeaderboardStats } from '@/lib/database';

export default function Leaderboard() {
  const [stats, setStats] = useState<(LeaderboardStats & { profile: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboardStats() {
      try {
        const { data, error } = await supabase
          .from('leaderboard_stats')
          .select(`
            *,
            profile:profiles(first_name, last_name, avatar_url)
          `)
          .order('profit_loss', { ascending: false })
          .limit(100);

        if (error) throw error;
        setStats(data || []);
      } catch (error) {
        console.error('Error loading leaderboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboardStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leaderboard</h2>
        <p className="text-muted-foreground">
          Top traders ranked by performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Traders
          </h3>
          <p className="text-2xl font-bold">{stats.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Average Win Rate
          </h3>
          <p className="text-2xl font-bold">
            {stats.length > 0
              ? `${(
                  stats.reduce((sum, s) => sum + (s.win_rate || 0), 0) /
                  stats.length
                ).toFixed(1)}%`
              : '0%'}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Volume
          </h3>
          <p className="text-2xl font-bold">
            KES{' '}
            {stats
              .reduce((sum, s) => sum + (s.total_volume || 0), 0)
              .toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Trades
          </h3>
          <p className="text-2xl font-bold">
            {stats
              .reduce((sum, s) => sum + (s.total_trades || 0), 0)
              .toLocaleString()}
          </p>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead>Total Trades</TableHead>
              <TableHead>Win Rate</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Profit/Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading leaderboard...
                </TableCell>
              </TableRow>
            ) : stats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No traders found.
                </TableCell>
              </TableRow>
            ) : (
              stats.map((stat, index) => (
                <TableRow key={stat.id}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {stat.profile.avatar_url && (
                        <img
                          src={stat.profile.avatar_url}
                          alt={`${stat.profile.first_name}'s avatar`}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>
                        {stat.profile.first_name} {stat.profile.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{stat.total_trades.toLocaleString()}</TableCell>
                  <TableCell>{stat.win_rate.toFixed(1)}%</TableCell>
                  <TableCell>
                    KES {stat.total_volume.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={
                      stat.profit_loss >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    KES {stat.profit_loss.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
