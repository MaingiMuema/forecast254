import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ 
      error: 'Search query is required' 
    }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Search in markets table
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('id, title, description, category, created_at')
      .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (marketsError) {
      throw marketsError;
    }

    return NextResponse.json({
      markets: markets || []
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform search' 
    }, { status: 500 });
  }
}
