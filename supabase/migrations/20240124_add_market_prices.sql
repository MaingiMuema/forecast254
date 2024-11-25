-- Add yes_price and no_price columns to markets table
ALTER TABLE markets
ADD COLUMN yes_price DECIMAL(10, 2) GENERATED ALWAYS AS (
  CASE 
    WHEN probability_yes IS NOT NULL THEN 
      CASE 
        WHEN probability_yes = 0 THEN 1 -- Minimum price
        WHEN probability_yes = 1 THEN 99 -- Maximum price
        ELSE probability_yes * 100 -- Convert probability to price (0.5 -> 50)
      END
    ELSE 50 -- Default price if probability is null
  END
) STORED,
ADD COLUMN no_price DECIMAL(10, 2) GENERATED ALWAYS AS (
  CASE 
    WHEN probability_no IS NOT NULL THEN 
      CASE 
        WHEN probability_no = 0 THEN 1 -- Minimum price
        WHEN probability_no = 1 THEN 99 -- Maximum price
        ELSE probability_no * 100 -- Convert probability to price (0.5 -> 50)
      END
    ELSE 50 -- Default price if probability is null
  END
) STORED;

-- Add comment explaining the columns
COMMENT ON COLUMN markets.yes_price IS 'Generated column that converts yes probability to price (1-99)';
COMMENT ON COLUMN markets.no_price IS 'Generated column that converts no probability to price (1-99)';
