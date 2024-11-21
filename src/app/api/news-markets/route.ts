/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { NewsMarketService } from '@/services/NewsMarketService';
import { kenyanNewsService } from '@/services/KenyanNewsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    const news = await kenyanNewsService.getNewsByCategory(category, limit ? parseInt(limit) : 10);
    
    return NextResponse.json(news);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch news'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const service = NewsMarketService.getInstance();
    const marketsCreated = await service.generateMarketsFromNews();
    
    return NextResponse.json({ 
      success: true, 
      marketsCreated,
      message: `Successfully created ${marketsCreated} markets from news articles`
    });
  } catch (error: any) {
    console.error('Error generating markets from news:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate markets from news'
      },
      { status: 500 }
    );
  }
}
