-- Add a function to handle balance updates when orders are matched
CREATE OR REPLACE FUNCTION update_balances_on_match(
    p_buyer_id UUID,
    p_seller_id UUID,
    p_match_amount INTEGER,
    p_match_price NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Update buyer's balance (deduct total cost)
    UPDATE profiles
    SET 
        balance = balance - (p_match_amount * p_match_price),
        updated_at = NOW()
    WHERE id = p_buyer_id;

    -- Update seller's balance (add total proceeds)
    UPDATE profiles
    SET 
        balance = balance + (p_match_amount * p_match_price),
        updated_at = NOW()
    WHERE id = p_seller_id;
END;
$$;

-- Modify the match_orders function to handle balance updates
CREATE OR REPLACE FUNCTION match_orders(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_matching_order RECORD;
    v_market RECORD;
    v_match_amount INTEGER;
    v_match_price NUMERIC;
    v_buyer_id UUID;
    v_seller_id UUID;
    v_result JSON;
BEGIN
    -- Get the order details and lock it
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND status IN ('open', 'partial')
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or not in matchable state';
    END IF;

    -- Get matching orders from the opposite side
    FOR v_matching_order IN
        SELECT *
        FROM orders
        WHERE market_id = v_order.market_id
        AND position = v_order.position
        AND status IN ('open', 'partial')
        AND user_id != v_order.user_id
        AND side = CASE v_order.side 
            WHEN 'buy' THEN 'sell' 
            WHEN 'sell' THEN 'buy' 
        END
        AND (
            v_order.order_type = 'market'
            OR order_type = 'market'
            OR (
                v_order.side = 'buy' 
                AND v_order.price >= price
                AND price IS NOT NULL
            )
            OR (
                v_order.side = 'sell'
                AND v_order.price <= price
                AND price IS NOT NULL
            )
        )
        ORDER BY 
            CASE WHEN order_type = 'market' THEN 0 ELSE 1 END,
            CASE 
                WHEN v_order.side = 'buy' THEN price
                ELSE -price
            END,
            created_at
        FOR UPDATE
    LOOP
        -- Calculate match amount
        v_match_amount := LEAST(
            v_order.remaining_amount,
            v_matching_order.remaining_amount
        );

        -- Determine execution price (use the older order's price)
        v_match_price := CASE
            WHEN v_matching_order.created_at < v_order.created_at THEN
                COALESCE(v_matching_order.price, v_order.price)
            ELSE
                COALESCE(v_order.price, v_matching_order.price)
        END;

        -- Determine buyer and seller
        IF v_order.side = 'buy' THEN
            v_buyer_id := v_order.user_id;
            v_seller_id := v_matching_order.user_id;
        ELSE
            v_buyer_id := v_matching_order.user_id;
            v_seller_id := v_order.user_id;
        END IF;

        -- Update balances
        PERFORM update_balances_on_match(
            v_buyer_id,
            v_seller_id,
            v_match_amount,
            v_match_price
        );

        -- Update the new order
        UPDATE orders
        SET
            filled_amount = filled_amount + v_match_amount,
            remaining_amount = remaining_amount - v_match_amount,
            status = CASE
                WHEN remaining_amount - v_match_amount = 0 THEN 'filled'
                ELSE 'partial'
            END,
            updated_at = NOW()
        WHERE id = v_order.id;

        -- Update the matching order
        UPDATE orders
        SET
            filled_amount = filled_amount + v_match_amount,
            remaining_amount = remaining_amount - v_match_amount,
            status = CASE
                WHEN remaining_amount - v_match_amount = 0 THEN 'filled'
                ELSE 'partial'
            END,
            updated_at = NOW()
        WHERE id = v_matching_order.id;

        -- Update market statistics
        UPDATE markets m
        SET
            total_yes_amount = CASE
                WHEN v_order.position = 'yes' THEN COALESCE(m.total_yes_amount, 0) + v_match_amount
                ELSE COALESCE(m.total_yes_amount, 0)
            END,
            total_no_amount = CASE
                WHEN v_order.position = 'no' THEN COALESCE(m.total_no_amount, 0) + v_match_amount
                ELSE COALESCE(m.total_no_amount, 0)
            END,
            trades = COALESCE(trades, 0) + 1,
            updated_at = NOW()
        WHERE id = v_order.market_id
        RETURNING * INTO v_market;

        -- Calculate new probabilities (yes_price and no_price will be automatically generated)
        UPDATE markets
        SET
            probability_yes = CASE
                WHEN COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0) > 0 THEN
                    LEAST(0.99, GREATEST(0.01, COALESCE(total_yes_amount, 0)::FLOAT / (COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0))))
                ELSE 0.5
            END,
            probability_no = CASE
                WHEN COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0) > 0 THEN
                    LEAST(0.99, GREATEST(0.01, COALESCE(total_no_amount, 0)::FLOAT / (COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0))))
                ELSE 0.5
            END
        WHERE id = v_order.market_id;

        -- Exit if order is fully filled
        IF v_order.remaining_amount - v_match_amount = 0 THEN
            EXIT;
        END IF;

        -- Update order record for next iteration
        SELECT * INTO v_order
        FROM orders
        WHERE id = p_order_id
        FOR UPDATE;
    END LOOP;

    -- Get final order state with profile balance
    SELECT json_build_object(
        'order', o.*,
        'profile', p.*,
        'market', m.*
    ) INTO v_result
    FROM orders o
    JOIN profiles p ON p.id = o.user_id
    JOIN markets m ON m.id = o.market_id
    WHERE o.id = p_order_id;

    RETURN v_result;
END;
$$;
