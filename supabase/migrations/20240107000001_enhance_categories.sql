-- Create an enum type for market categories
CREATE TYPE market_category AS ENUM (
  'all',
  'trending',
  'sports',
  'politics',
  'entertainment',
  'business',
  'tech',
  'education'
);

-- Add check constraint to ensure category is valid
ALTER TABLE markets
ALTER COLUMN category TYPE market_category USING category::market_category,
ALTER COLUMN category SET NOT NULL,
ALTER COLUMN category SET DEFAULT 'all';

-- Create index for faster category filtering
CREATE INDEX idx_markets_category ON markets(category);

-- Create a view to get market counts by category
CREATE OR REPLACE VIEW market_category_counts AS
SELECT 
  category,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'open') as active_count
FROM markets
GROUP BY category;
