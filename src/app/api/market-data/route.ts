/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { DataCollectionService } from '@/services/DataCollectionService';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const service = DataCollectionService.getInstance();
    console.log('Starting data collection...');
    
    await service.collectData();
    
    // Get total articles count
    const { count } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact' });

    return NextResponse.json({ 
      success: true, 
      message: 'Data collection completed successfully',
      data: {
        totalArticles: count
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
