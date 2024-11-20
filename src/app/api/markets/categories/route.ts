import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CategoryCounts {
  [key: string]: number;
}

export async function GET() {
  try {
    // Get category counts from the view we created
    const { data: categoryCounts, error } = await supabase
      .from('market_category_counts')
      .select('*');

    if (error) {
      throw error;
    }

    // Transform into an object with category as key
    const counts: CategoryCounts = categoryCounts.reduce((acc, { category, active_count }) => {
      acc[category] = active_count;
      return acc;
    }, {});

    // Add trending count (markets with high trending_score)
    const { count: trendingCount } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .gt('trending_score', 100);

    counts['trending'] = trendingCount || 0;

    // Calculate total for 'all' category
    counts['all'] = Object.values(counts).reduce((sum, count) => sum + count, 0) - (counts['trending'] || 0);

    return NextResponse.json(counts);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch category counts' }, { status: 500 });
  }
}
