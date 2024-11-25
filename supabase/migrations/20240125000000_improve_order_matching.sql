-- Create a function to handle order matching in a transaction
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
            -- Match if either order is market order
            v_order.order_type = 'market'
            OR order_type = 'market'
            -- Or if limit prices match
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
            -- Prioritize market orders
            CASE WHEN order_type = 'market' THEN 0 ELSE 1 END,
            -- Then by best price
            CASE 
                WHEN v_order.side = 'buy' THEN price
                ELSE -price
            END,
            -- Then by creation time
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
            last_trade_price = v_match_price,
            last_trade_time = NOW(),
            trades = COALESCE(trades, 0) + 1,
            updated_at = NOW()
        WHERE id = v_order.market_id
        RETURNING * INTO v_market;

        -- Calculate new probabilities
        UPDATE markets
        SET
            probability_yes = CASE
                WHEN COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0) > 0 THEN
                    COALESCE(total_yes_amount, 0)::FLOAT / (COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0))
                ELSE 0.5
            END,
            probability_no = CASE
                WHEN COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0) > 0 THEN
                    COALESCE(total_no_amount, 0)::FLOAT / (COALESCE(total_yes_amount, 0) + COALESCE(total_no_amount, 0))
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

    -- Get final order state
    SELECT row_to_json(o.*) INTO v_result
    FROM orders o
    WHERE o.id = p_order_id;

    RETURN v_result;
END;
$$;

-- Add trigger to automatically match orders after creation
CREATE OR REPLACE FUNCTION trigger_match_orders()
RETURNS TRIGGER AS $$
BEGIN
    -- Only attempt to match if the order is open
    IF NEW.status = 'open' THEN
        PERFORM match_orders(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_match_orders ON orders;
CREATE TRIGGER auto_match_orders
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_match_orders();

-- Add indices for better matching performance
CREATE INDEX IF NOT EXISTS idx_orders_matching 
ON orders (
    market_id,
    position,
    status,
    side,
    price,
    created_at
) 
WHERE status IN ('open', 'partial');
