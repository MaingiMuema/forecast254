-- Create the function to get market statistics
CREATE OR REPLACE FUNCTION get_market_statistics(market_id_param UUID)
RETURNS TABLE (
    total_trades BIGINT,
    total_volume NUMERIC,
    unique_traders BIGINT,
    probability_yes NUMERIC,
    probability_no NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH order_stats AS (
        SELECT 
            COUNT(*) as trade_count,
            COUNT(DISTINCT user_id) as trader_count,
            COALESCE(SUM(filled_amount * price), 0) as volume
        FROM orders
        WHERE market_id = market_id_param
        AND status = 'filled'
    )
    SELECT 
        os.trade_count,
        os.volume,
        os.trader_count,
        COALESCE(m.probability_yes, 0.5),
        COALESCE(m.probability_no, 0.5)
    FROM order_stats os
    CROSS JOIN markets m
    WHERE m.id = market_id_param;
END;
$$;
