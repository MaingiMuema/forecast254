/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface LeaderboardStats {
  win_rate: number;
}

interface Transaction {
  id: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  balance: number;
  stats: LeaderboardStats | null;
  trades: Transaction[] | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const timeframe = searchParams.get('timeframe') || 'all';

    // First, get user profiles with their stats
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        avatar_url,
        balance,
        stats:leaderboard_stats (
          win_rate
        ),
        trades:transactions (
          id
        )
      `)
      .order('balance', { ascending: false })
      .limit(100) as { data: Profile[] | null; error: any };

    if (error) throw error;

    // Transform the data to match the LeaderboardUser type
    const rankedUsers = users?.map((user, index) => {
      const totalTrades = user.trades?.length || 0;
      const correctPredictions = Math.round((user.stats?.win_rate || 0) * totalTrades);

      return {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        points: Math.round(user.balance),
        correct_predictions: correctPredictions,
        total_predictions: totalTrades,
        rank: index + 1
      };
    }) || [];

    return NextResponse.json(rankedUsers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
