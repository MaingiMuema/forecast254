-- Add views and trades columns to markets table
ALTER TABLE markets
ADD COLUMN views INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN trades INTEGER DEFAULT 0 NOT NULL;

-- Create an index for faster querying on these columns
CREATE INDEX idx_markets_views ON markets(views);
CREATE INDEX idx_markets_trades ON markets(trades);

-- Add a function to calculate trending score based on views and trades
CREATE OR REPLACE FUNCTION calculate_trending_score(views INTEGER, trades INTEGER)
RETURNS FLOAT AS $$
BEGIN
    -- Formula: (2 * trades + views) to give more weight to actual trades
    RETURN (2 * trades + views)::FLOAT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a trending_score column that automatically updates
ALTER TABLE markets
ADD COLUMN trending_score FLOAT GENERATED ALWAYS AS (calculate_trending_score(views, trades)) STORED;
