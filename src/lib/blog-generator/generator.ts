/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';
import { BlogGenerationPrompt, ImageGenerationPrompt, BlogPost } from './types';

if (!process.env.AWAN_API_KEY) {
  throw new Error('Missing AWAN_API_KEY environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

if (!process.env.POLLINATION_API_KEY) {
  throw new Error('Missing POLLINATION_API_KEY environment variable');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function callAwanAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://www.awanllm.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AWAN_API_KEY}`
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3.1-70B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert blog writer for Forecast254, a predictive markets platform in Kenya.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Awan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Awan API:', error);
    throw error;
  }
}

export async function generateBlogContent(prompt: BlogGenerationPrompt): Promise<{ title: string; content: string; excerpt: string }> {
  const userPrompt = `Write a blog post with the following specifications:
- Topic: ${prompt.topic}
- Target audience: ${prompt.target_audience}
- Tone: ${prompt.tone}
- Writing style: ${prompt.style}
- Word count: approximately ${prompt.word_count} words
- Key points to include: ${prompt.key_points.join(', ')}

Format your response exactly as follows (including the JSON markers):
---JSON---
{
  "title": "The blog post title",
  "content": "The full blog post content in markdown format",
  "excerpt": "A compelling 2-3 sentence summary of the post"
}
---END JSON---`;

  const result = await callAwanAPI(userPrompt);
  
  // Extract JSON from the response
  const jsonMatch = result.match(/---JSON---([\s\S]*?)---END JSON---/);
  if (!jsonMatch) {
    throw new Error('Failed to parse blog content from API response');
  }

  try {
    const blogData = JSON.parse(jsonMatch[1].trim());
    return {
      title: blogData.title,
      content: blogData.content,
      excerpt: blogData.excerpt
    };
  } catch (error) {
    console.error('Error parsing blog content:', error);
    throw new Error('Failed to parse blog content JSON');
  }
}

export async function generateImage(prompt: ImageGenerationPrompt): Promise<string> {
  try {
    const response = await fetch('https://api.pollinations.ai/v1/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.POLLINATION_API_KEY}`
      },
      body: JSON.stringify({
        prompt: `${prompt.description}. Style: ${prompt.style}. Mood: ${prompt.mood}`,
        aspect_ratio: prompt.aspect_ratio,
        quality: prompt.quality,
        num_images: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.images[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

export async function createBlogPost(
  content: { title: string; content: string; excerpt: string },
  coverImage: string,
  category: string
): Promise<BlogPost> {
  const slug = slugify(content.title, { lower: true, strict: true });
  const now = new Date();

  const { data: existingPost } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingPost) {
    throw new Error('A blog post with this title already exists');
  }

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title: content.title,
      slug,
      content: content.content,
      excerpt: content.excerpt,
      cover_image: coverImage,
      category,
      status: 'published',
      published_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      author: 'AI Writer',
      ai_generated: true,
      metadata: {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }

  return post;
}

export async function generateScheduledBlogPost(topic?: string): Promise<BlogPost> {
  // Default blog generation settings
  const prompt: BlogGenerationPrompt = {
    topic: topic || 'Latest trends in Kenyan predictive markets',
    style: 'informative and engaging',
    tone: 'professional yet approachable',
    target_audience: 'Kenyan investors and market enthusiasts',
    key_points: [
      'Current market trends',
      'Investment opportunities',
      'Risk management',
      'Market analysis',
      'Future predictions'
    ],
    word_count: 1000,
    category: 'Markets'
  };

  // Generate blog content
  console.log('Generating blog content...');
  const content = await generateBlogContent(prompt);

  // Generate cover image
  console.log('Generating cover image...');
  const imagePrompt: ImageGenerationPrompt = {
    description: `A modern, professional image representing ${content.title}`,
    style: 'digital art, professional, clean',
    mood: 'optimistic, business-oriented',
    aspect_ratio: '16:9',
    quality: 'high'
  };
  const coverImage = await generateImage(imagePrompt);

  // Create and store the blog post
  console.log('Creating blog post...');
  return await createBlogPost(content, coverImage, prompt.category);
}
