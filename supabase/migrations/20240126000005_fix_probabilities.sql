-- Drop existing function
DROP FUNCTION IF EXISTS create_order_with_balance_update(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC);

-- Create improved function with fixed probability calculation
CREATE OR REPLACE FUNCTION create_order_with_balance_update(
  p_market_id UUID,
  p_user_id UUID,
  p_order_type TEXT,
  p_side TEXT,
  p_position TEXT,
  p_price NUMERIC,
  p_amount NUMERIC,
  p_required_funds NUMERIC
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order_record RECORD;
  v_profile_record RECORD;
  v_result JSON;
  v_market_record RECORD;
  v_available_shares NUMERIC;
  v_new_prob_yes NUMERIC;
  v_new_prob_no NUMERIC;
BEGIN
  -- Get market details first
  SELECT * INTO v_market_record
  FROM markets
  WHERE id = p_market_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found or not open';
  END IF;

  -- Validate share amount (not monetary value)
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'Number of shares must be at least 1';
  END IF;

  -- Handle buy orders
  IF p_side = 'buy' THEN
    -- Update balance first (optimistic locking)
    UPDATE profiles
    SET 
      balance = balance - p_required_funds,
      updated_at = NOW()
    WHERE id = p_user_id AND balance >= p_required_funds
    RETURNING * INTO v_profile_record;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient funds or profile not found';
    END IF;

  -- Handle sell orders
  ELSE
    -- Calculate available shares from previous orders
    SELECT COALESCE(
      (
        SELECT SUM(
          CASE 
            WHEN side = 'buy' THEN filled_amount
            WHEN side = 'sell' THEN -filled_amount
            ELSE 0
          END
        )
        FROM orders
        WHERE user_id = p_user_id 
        AND market_id = p_market_id 
        AND position = p_position
        AND status = 'filled'
      ), 0) INTO v_available_shares;

    IF v_available_shares < p_amount THEN
      RAISE EXCEPTION 'Insufficient shares. Available: %', v_available_shares;
    END IF;

    -- Credit user's balance with sale proceeds
    UPDATE profiles
    SET 
      balance = balance + (p_price * p_amount),
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO v_profile_record;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;
  END IF;

  -- Create the order record (now always filled instantly)
  INSERT INTO orders (
    market_id,
    user_id,
    order_type,
    side,
    position,
    price,
    amount,
    filled_amount,
    remaining_amount,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_market_id,
    p_user_id,
    p_order_type,
    p_side,
    p_position,
    p_price,
    p_amount::integer,
    p_amount::integer,  -- Fully filled
    0,                  -- No remaining amount
    'filled',          -- Always filled
    NOW(),
    NOW()
  ) RETURNING * INTO v_order_record;

  -- Calculate new probabilities based on price
  -- Price is assumed to be between 1-100 KES
  -- Convert price to probability (0-1 range)
  IF p_position = 'yes' THEN
    v_new_prob_yes = p_price / 100.0;
    v_new_prob_no = 1 - v_new_prob_yes;
  ELSE
    v_new_prob_no = p_price / 100.0;
    v_new_prob_yes = 1 - v_new_prob_no;
  END IF;

  -- Ensure probabilities are within valid range
  v_new_prob_yes = GREATEST(0.01, LEAST(0.99, v_new_prob_yes));
  v_new_prob_no = GREATEST(0.01, LEAST(0.99, v_new_prob_no));

  -- Update market statistics and probabilities
  UPDATE markets
  SET 
    trades = trades + 1,
    last_trade_price = p_price,
    last_trade_time = NOW(),
    probability_yes = v_new_prob_yes,
    probability_no = v_new_prob_no,
    updated_at = NOW()
  WHERE id = p_market_id;

  -- Calculate current position for the response
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN side = 'buy' THEN filled_amount
        WHEN side = 'sell' THEN -filled_amount
        ELSE 0
      END
    ), 0) as shares
  INTO v_available_shares
  FROM orders
  WHERE user_id = p_user_id 
  AND market_id = p_market_id 
  AND position = p_position
  AND status = 'filled';

  -- Return the updated balance directly at the top level
  RETURN json_build_object(
    'order', row_to_json(v_order_record),
    'balance', v_profile_record.balance::numeric,
    'shares', v_available_shares,
    'probabilities', json_build_object(
      'yes', v_new_prob_yes,
      'no', v_new_prob_no
    )
  );
END;
$$;
