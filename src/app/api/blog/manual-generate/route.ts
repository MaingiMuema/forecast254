import { NextResponse } from 'next/server';
import { generateScheduledBlogPost } from '@/lib/blog-generator/generator';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has admin role
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get topic from request body
    const { topic } = await request.json();

    // Generate the blog post
    const post = await generateScheduledBlogPost(topic);

    return NextResponse.json({
      message: 'Blog post generated successfully',
      post
    });
  } catch (error) {
    console.error('Manual blog generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}
