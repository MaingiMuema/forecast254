-- Drop existing foreign key if it exists
alter table public.markets
drop constraint if exists markets_source_article_id_fkey;

-- Recreate foreign key with proper configuration
alter table public.markets
add constraint markets_source_article_id_fkey 
foreign key (source_article_id) 
references public.news_articles(id) 
on delete set null 
on update cascade;

-- Create index for the foreign key
create index if not exists idx_markets_source_article_id 
on public.markets(source_article_id);

-- Ensure proper permissions
grant references on public.news_articles to authenticated;
grant references on public.news_articles to anon;
