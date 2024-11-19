/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import DataCollectionService from '@/services/DataCollectionService';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const service = DataCollectionService.getInstance();
    
    // Check if collection is already running
    if (service.isCollectionRunning()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Data collection is already in progress' 
      });
    }

    // Get last run time
    const lastRunTime = service.getLastRunTime();
    
    // Trigger data collection
    await service.triggerDataCollection();

    // Get total articles count
    const { count } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact' });

    return NextResponse.json({ 
      success: true, 
      message: 'Data collection completed successfully',
      data: {
        totalArticles: count,
        lastRunTime,
        nextRunTime: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
      }
    });
  } catch (error) {
    console.error('Error in market data endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to collect market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
