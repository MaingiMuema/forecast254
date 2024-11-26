-- First, drop the existing foreign key constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_market_id_fkey;

-- Then recreate it with ON DELETE CASCADE
ALTER TABLE orders
ADD CONSTRAINT orders_market_id_fkey 
FOREIGN KEY (market_id) 
REFERENCES markets(id) 
ON DELETE CASCADE;

-- Add comment explaining the cascade behavior
COMMENT ON CONSTRAINT orders_market_id_fkey ON orders IS 
'Foreign key to markets table with cascade delete - when a market is deleted, all its orders are automatically deleted';
