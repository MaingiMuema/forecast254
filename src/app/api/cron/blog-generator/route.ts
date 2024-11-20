/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Topics for each day of the week
const DAILY_TOPICS = [
  'Market Analysis Monday: Weekly Market Trends in Kenya',
  'Technology Tuesday: Innovation in Predictive Markets',
  'Wisdom Wednesday: Investment Strategies and Tips',
  'Trends Thursday: Emerging Market Opportunities',
  'Finance Friday: Economic Updates and Analysis',
];

export async function GET(request: Request) {
  try {
    // Verify cron secret if needed
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if we should generate a post today (weekdays only)
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({ message: 'No blog generation scheduled for weekends' });
    }

    // Trigger blog generation via the blog generation endpoint
    const response = await fetch(new URL('/api/blog/trigger-generation', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || ''
      },
      body: JSON.stringify({
        topic: DAILY_TOPICS[dayOfWeek - 1] // -1 because dayOfWeek is 1-based for weekdays
      })
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run blog generation cron job' },
      { status: 500 }
    );
  }
}
