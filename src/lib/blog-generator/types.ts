/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  author: string;
  category: string;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
  status: 'draft' | 'published' | 'archived';
  metadata: Record<string, any>;
  ai_generated: boolean;
}

export interface BlogGenerationSchedule {
  id: string;
  scheduled_for: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  topic?: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
  error_message?: string;
}

export interface BlogGenerationPrompt {
  topic: string;
  style: string;
  tone: string;
  target_audience: string;
  key_points: string[];
  word_count: number;
  category: string;
}

export interface ImageGenerationPrompt {
  description: string;
  style: string;
  mood: string;
  aspect_ratio: string;
  quality: string;
}
