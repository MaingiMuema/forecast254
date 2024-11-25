-- Drop the existing function first
DROP FUNCTION IF EXISTS create_order_with_balance_update(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC);

-- Create a function to handle order creation and balance update in a transaction
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
BEGIN
  -- Get market details first
  SELECT * INTO v_market_record
  FROM markets
  WHERE id = p_market_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found or not open';
  END IF;

  -- Validate minimum amount only
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'Number of shares must be at least 1';
  END IF;

  -- Update balance first (optimistic locking), but only for buy orders
  IF p_side = 'buy' THEN
    UPDATE profiles
    SET 
      balance = balance - p_required_funds,
      updated_at = NOW()
    WHERE id = p_user_id AND balance >= p_required_funds
    RETURNING * INTO v_profile_record;

    -- Check if balance update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient funds or profile not found';
    END IF;
  ELSE
    -- For sell orders, just get the profile without updating balance
    SELECT * INTO v_profile_record
    FROM profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;
  END IF;

  -- Create the order
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
    CASE 
      WHEN p_order_type IN ('limit', 'market') THEN p_price
      ELSE NULL
    END,
    p_amount::integer,
    0,
    p_amount::integer,
    'open',
    NOW(),
    NOW()
  ) RETURNING * INTO v_order_record;

  -- Update market statistics
  UPDATE markets
  SET 
    trades = trades + 1,
    updated_at = NOW()
  WHERE id = p_market_id;

  -- Construct the result JSON
  SELECT json_build_object(
    'order', row_to_json(v_order_record),
    'profile', row_to_json(v_profile_record),
    'market', row_to_json(v_market_record)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
