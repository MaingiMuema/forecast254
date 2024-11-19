-- Add policy to allow service role to insert news articles
create policy "Service role can insert news articles"
on public.news_articles for insert
using (true);

-- Add policy to allow service role to update news articles
create policy "Service role can update news articles"
on public.news_articles for update
using (true);
