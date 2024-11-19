import { NextResponse } from 'next/server';
import { MarketGenerationService } from '@/services/MarketGenerationService';

export async function POST() {
  try {
    const service = MarketGenerationService.getInstance();
    const marketsCreated = await service.generateMarketsFromArticles();

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
