-- Add last trade columns to markets table
ALTER TABLE markets
ADD COLUMN IF NOT EXISTS last_trade_price NUMERIC,
ADD COLUMN IF NOT EXISTS last_trade_time TIMESTAMP WITH TIME ZONE;
