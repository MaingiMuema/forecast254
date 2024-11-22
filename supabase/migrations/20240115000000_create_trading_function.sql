-- First drop the expression from trending_score if it exists
ALTER TABLE markets 
ALTER COLUMN trending_score DROP EXPRESSION IF EXISTS;

-- Add new columns to markets table if they don't exist
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS min_amount decimal(10,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS max_amount decimal(10,2) DEFAULT 10000.00,
ADD COLUMN IF NOT EXISTS total_yes_amount decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_no_amount decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_volume decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS probability_yes decimal(10,4) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS probability_no decimal(10,4) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS trades integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;

-- Create market_positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS market_positions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    market_id uuid REFERENCES markets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    position text CHECK (position IN ('yes', 'no')),
    amount decimal(10,2) NOT NULL,
    shares decimal(10,4) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS calculate_trending_score(integer, integer) CASCADE;

-- Create function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
    p_views integer,
    p_trades integer
) RETURNS decimal(10,2)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN CASE 
        WHEN p_trades = 0 THEN 0
        ELSE (p_views::decimal / NULLIF(p_trades::decimal, 0))
    END;
END;
$$;

-- Add trending_score as a generated column
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS trending_score decimal(10,2) GENERATED ALWAYS AS (
    calculate_trending_score(views, trades)
) STORED;

-- Create function to execute a trade
CREATE OR REPLACE FUNCTION execute_trade(
    p_market_id uuid,
    p_user_id uuid,
    p_position text,
    p_amount decimal,
    p_shares decimal
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_balance decimal;
    v_market_status text;
    v_market_closing_date timestamptz;
    v_views integer;
BEGIN
    -- Check market status
    SELECT status, closing_date, views INTO v_market_status, v_market_closing_date, v_views
    FROM markets
    WHERE id = p_market_id;

    IF v_market_status != 'open' OR v_market_closing_date <= now() THEN
        RAISE EXCEPTION 'Market is closed';
    END IF;

    -- Check user balance
    SELECT balance INTO v_user_balance
    FROM profiles
    WHERE id = p_user_id;

    IF v_user_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Update user balance
    UPDATE profiles
    SET balance = balance - p_amount
    WHERE id = p_user_id;

    -- Create position
    INSERT INTO market_positions (
        market_id,
        user_id,
        position,
        amount,
        shares
    ) VALUES (
        p_market_id,
        p_user_id,
        p_position,
        p_amount,
        p_shares
    );

    -- Update market stats
    UPDATE markets
    SET 
        total_volume = total_volume + p_amount,
        total_yes_amount = CASE 
            WHEN p_position = 'yes' THEN total_yes_amount + p_amount 
            ELSE total_yes_amount 
        END,
        total_no_amount = CASE 
            WHEN p_position = 'no' THEN total_no_amount + p_amount 
            ELSE total_no_amount 
        END,
        probability_yes = CASE 
            WHEN (total_yes_amount + total_no_amount + p_amount) > 0 THEN
                CASE p_position
                    WHEN 'yes' THEN ((total_yes_amount + p_amount) / (total_yes_amount + total_no_amount + p_amount))
                    ELSE (total_yes_amount / (total_yes_amount + total_no_amount + p_amount))
                END
            ELSE 0.5
        END,
        probability_no = CASE 
            WHEN (total_yes_amount + total_no_amount + p_amount) > 0 THEN
                CASE p_position
                    WHEN 'yes' THEN (total_no_amount / (total_yes_amount + total_no_amount + p_amount))
                    ELSE ((total_no_amount + p_amount) / (total_yes_amount + total_no_amount + p_amount))
                END
            ELSE 0.5
        END,
        trades = trades + 1,
        updated_at = now()
    WHERE id = p_market_id;

EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Trade execution failed: %', SQLERRM;
END;
$$;
