import { NextResponse } from 'next/server';
import { newsMarketOrchestrator } from '@/services/NewsMarketOrchestrator';
import { logger } from '@/utils/logger';

// Verify environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

export async function POST() {
  try {
    logger.info('Market generation API route called');
    logger.info('Got NewsMarketOrchestrator instance');
    
    const marketsCreated = await newsMarketOrchestrator.processNewsAndGenerateMarkets();
    logger.info(`Generated ${marketsCreated} markets`);

    return NextResponse.json({ 
      success: true, 
      message: 'Market generation completed successfully',
      marketsCreated
    });
  } catch (error) {
    logger.error('Error in market generation endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error generating markets',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
