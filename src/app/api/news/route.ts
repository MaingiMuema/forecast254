import { NextResponse } from 'next/server';
import { kenyanNewsService } from '@/services/KenyanNewsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';

    const news = await kenyanNewsService.getNewsByCategory(category);

    // Create response with proper headers
    const response = NextResponse.json({
      success: true,
      data: news
    });

    // Set cache control headers
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=59'
    );

    return response;
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
