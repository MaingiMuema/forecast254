-- Add status column to news_articles table
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Update existing rows to have 'published' status
UPDATE news_articles 
SET status = 'published' 
WHERE status IS NULL;
