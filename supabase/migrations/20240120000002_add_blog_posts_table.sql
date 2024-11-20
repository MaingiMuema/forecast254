-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    category TEXT,
    tags TEXT[],
    slug TEXT UNIQUE NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON public.blog_posts(created_at);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_ai_generated_idx ON public.blog_posts(ai_generated);

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public blogs are viewable by everyone" 
    ON public.blog_posts
    FOR SELECT
    USING (status = 'published');

CREATE POLICY "Users can create blog posts" 
    ON public.blog_posts
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own blog posts" 
    ON public.blog_posts
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "System user can manage all blog posts"
    ON public.blog_posts
    USING (auth.uid() = (SELECT id FROM auth.users WHERE email = 'system@forecast254.com'));
