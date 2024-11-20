import { NextResponse } from 'next/server';
import { MarketGenerationService } from '@/services/MarketGenerationService';

// Verify environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

export async function POST() {
  try {
    console.log('Market generation API route called');
    const service = MarketGenerationService.getInstance();
    console.log('Got MarketGenerationService instance');
    
    const marketsCreated = await service.generateMarketsFromArticles();
    console.log(`Generated ${marketsCreated} markets`);

    return NextResponse.json({ 
      success: true, 
      message: 'Market generation completed successfully',
      marketsCreated
    });
  } catch (error) {
    console.error('Error in market generation endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error generating markets',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
