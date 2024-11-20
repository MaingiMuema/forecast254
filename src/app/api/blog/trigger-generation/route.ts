import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateScheduledBlogPost } from '@/lib/blog-generator/generator';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: Request) {
  try {
    // Check authorization if needed
    const authHeader = request.headers.get('authorization');
    if (process.env.API_SECRET && authHeader !== `Bearer ${process.env.API_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get topic from request body
    const body = await request.json();
    const { topic } = body;

    // Check if we've already generated a post today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('id')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .eq('ai_generated', true);

    if (existingPosts && existingPosts.length > 0) {
      return NextResponse.json({ 
        message: 'Blog post already generated today',
        postIds: existingPosts.map(p => p.id)
      });
    }

    // Generate the blog post
    console.log('Generating blog post with topic:', topic);
    const post = await generateScheduledBlogPost(topic);
    
    return NextResponse.json({
      message: 'Blog post generated successfully',
      post
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get today's generated posts
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .eq('ai_generated', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: posts.length > 0 ? 'Found generated posts' : 'No posts generated today',
      posts
    });
  } catch (error) {
    console.error('Error fetching generated posts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch generated posts' },
      { status: 500 }
    );
  }
}
