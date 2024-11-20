-- Create blog posts table
create table if not exists public.blog_posts (
    id uuid default gen_random_uuid() primary key,
    slug text unique not null,
    title text not null,
    content text not null,
    excerpt text not null,
    cover_image text not null,
    author text not null,
    category text not null,
    published_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    metadata jsonb default '{}'::jsonb,
    ai_generated boolean default false
);

-- Create blog generation schedule table
create table if not exists public.blog_generation_schedule (
    id uuid default gen_random_uuid() primary key,
    scheduled_for timestamp with time zone not null,
    status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    topic text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    metadata jsonb default '{}'::jsonb,
    error_message text
);

-- Add RLS policies
alter table public.blog_posts enable row level security;
alter table public.blog_generation_schedule enable row level security;

-- Allow public read access to published posts
create policy "Public can view published posts"
    on public.blog_posts
    for select
    using (status = 'published');

-- Allow authenticated users with admin role to manage posts
create policy "Admins can manage posts"
    on public.blog_posts
    for all
    using (auth.jwt() ->> 'role' = 'admin');

-- Allow authenticated users with admin role to manage schedule
create policy "Admins can manage schedule"
    on public.blog_generation_schedule
    for all
    using (auth.jwt() ->> 'role' = 'admin');

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_blog_posts_updated_at
    before update on public.blog_posts
    for each row
    execute function public.handle_updated_at();

create trigger handle_blog_generation_schedule_updated_at
    before update on public.blog_generation_schedule
    for each row
    execute function public.handle_updated_at();

-- Create indexes
create index if not exists blog_posts_published_at_idx on public.blog_posts(published_at);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_generation_schedule_status_idx on public.blog_generation_schedule(status);
create index if not exists blog_generation_schedule_scheduled_for_idx on public.blog_generation_schedule(scheduled_for);
