-- Add has_market column to news_articles table
ALTER TABLE news_articles
ADD COLUMN has_market BOOLEAN DEFAULT false;

-- Update existing articles to have has_market = false
UPDATE news_articles
SET has_market = false
WHERE has_market IS NULL;
