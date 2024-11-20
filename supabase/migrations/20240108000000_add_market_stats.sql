-- Create function to get market stats
CREATE OR REPLACE FUNCTION get_market_stats(market_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH market_stats AS (
        SELECT
            COUNT(*) as total_trades,
            COALESCE(SUM(total), 0) as total_volume,
            COUNT(DISTINCT user_id) as unique_traders
        FROM transactions
        WHERE market_id = $1
    )
    SELECT json_build_object(
        'total_trades', COALESCE(total_trades, 0),
        'total_volume', COALESCE(total_volume, 0),
        'unique_traders', COALESCE(unique_traders, 0)
    ) INTO result
    FROM market_stats;

    RETURN result;
END;
$$;
