-- Drop existing policies
drop policy if exists "Markets are viewable by everyone" on public.markets;
drop policy if exists "Authenticated users can create markets" on public.markets;
drop policy if exists "News articles are viewable by everyone" on public.news_articles;

-- Add missing columns to news_articles
alter table public.news_articles 
add column if not exists source text,
add column if not exists author text,
add column if not exists description text,
add column if not exists image_url text;

-- Update markets table to ensure source_article_id
alter table public.markets
drop constraint if exists markets_source_article_id_fkey,
add column if not exists source_article_id uuid references public.news_articles(id) on delete set null;

-- Create updated RLS policies for markets
create policy "Enable read access for all users"
    on public.markets for select
    to authenticated, anon
    using (true);

create policy "Enable insert for authenticated users only"
    on public.markets for insert
    to authenticated
    with check (true);

-- Create RLS policies for news_articles
create policy "Enable read access for all users"
    on public.news_articles for select
    to authenticated, anon
    using (true);

create policy "Enable insert for authenticated users only"
    on public.news_articles for insert
    to authenticated
    with check (true);

-- Add trigger for news_articles updated_at
drop trigger if exists handle_updated_at_news_articles on public.news_articles;
create trigger handle_updated_at_news_articles
    before update on public.news_articles
    for each row
    execute function public.handle_updated_at();

-- Add indexes for better performance
create index if not exists idx_news_articles_published_at 
    on public.news_articles(published_at desc);
create index if not exists idx_news_articles_url 
    on public.news_articles(url);
create index if not exists idx_markets_source_article_id 
    on public.markets(source_article_id);

-- Update existing news_articles rows if any missing columns
update public.news_articles
set 
    source = coalesce(source, 'unknown'),
    author = coalesce(author, 'Unknown'),
    description = coalesce(description, ''),
    image_url = coalesce(image_url, null)
where 
    source is null 
    or author is null 
    or description is null;
