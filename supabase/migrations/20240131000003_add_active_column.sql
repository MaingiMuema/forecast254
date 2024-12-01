-- Add active column to markets table
ALTER TABLE public.markets
ADD COLUMN active boolean DEFAULT false;

-- Update existing rows to have active = true (optional, remove if you want all existing markets to start as inactive)
UPDATE public.markets SET active = true WHERE active IS NULL;

-- Add comment to explain column purpose
COMMENT ON COLUMN public.markets.active IS 'Indicates whether the market is currently active and visible to users';
