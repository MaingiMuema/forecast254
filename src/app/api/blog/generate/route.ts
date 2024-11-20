import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateScheduledBlogPost } from '@/lib/blog-generator/generator';
import { BlogGenerationSchedule } from '@/lib/blog-generator/types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    // Get pending scheduled posts
    const { data: schedules, error: fetchError } = await supabase
      .from('blog_generation_schedule')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for')
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch schedules: ${fetchError.message}`);
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: 'No pending posts to generate' });
    }

    const schedule = schedules[0] as BlogGenerationSchedule;

    // Update schedule status to processing
    const { error: updateError } = await supabase
      .from('blog_generation_schedule')
      .update({ status: 'processing' })
      .eq('id', schedule.id);

    if (updateError) {
      throw new Error(`Failed to update schedule status: ${updateError.message}`);
    }

    try {
      // Generate blog post
      const post = await generateScheduledBlogPost(schedule.topic);

      // Update schedule status to completed
      await supabase
        .from('blog_generation_schedule')
        .update({
          status: 'completed',
          metadata: {
            ...schedule.metadata,
            generated_post_id: post.id
          }
        })
        .eq('id', schedule.id);

      return NextResponse.json({
        message: 'Blog post generated successfully',
        post
      });
    } catch (error) {
      // Update schedule status to failed
      await supabase
        .from('blog_generation_schedule')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', schedule.id);

      throw error;
    }
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}

// Schedule new blog posts for the next 5 weekdays
export async function PUT() {
  try {
    const schedules: Partial<BlogGenerationSchedule>[] = [];
    let date = new Date();
    let count = 0;

    while (count < 5) {
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        schedules.push({
          scheduled_for: date,
          status: 'pending',
          metadata: {
            scheduled_by: 'system',
            schedule_type: 'automatic'
          }
        });
        count++;
      }
      date = new Date(date.setDate(date.getDate() + 1));
    }

    const { error } = await supabase
      .from('blog_generation_schedule')
      .insert(schedules);

    if (error) {
      throw new Error(`Failed to create schedules: ${error.message}`);
    }

    return NextResponse.json({
      message: 'Blog generation schedule created successfully',
      schedules
    });
  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create blog generation schedule' },
      { status: 500 }
    );
  }
}
