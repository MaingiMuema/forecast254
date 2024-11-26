-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS update_market_volume_on_order_change ON orders;
DROP FUNCTION IF EXISTS calculate_market_volume() CASCADE;
DROP FUNCTION IF EXISTS get_market_volume(UUID) CASCADE;
DROP FUNCTION IF EXISTS recalculate_all_market_volumes() CASCADE;

-- Function to calculate and update market volume
CREATE OR REPLACE FUNCTION calculate_market_volume()
RETURNS TRIGGER AS $$
BEGIN
    WITH volume_calculation AS (
        SELECT 
            market_id,
            SUM(CASE 
                WHEN side = 'buy' THEN filled_amount * price
                WHEN side = 'sell' THEN -1 * (filled_amount * price)
            END) as volume_change,
            COUNT(*) as trades
        FROM orders
        WHERE status = 'filled'
        AND market_id = NEW.market_id
        GROUP BY market_id
    )
    UPDATE markets m
    SET 
        total_volume = GREATEST(0, COALESCE(m.total_volume, 0) + COALESCE(vc.volume_change, 0)),
        trades = COALESCE(vc.trades, 0),
        updated_at = NOW()
    FROM volume_calculation vc
    WHERE m.id = vc.market_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_market_volume_on_order_change
    AFTER INSERT OR UPDATE OF status, filled_amount, price
    ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'filled')
    EXECUTE FUNCTION calculate_market_volume();

-- Function to get market volume
CREATE FUNCTION get_market_volume(market_id_param UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT total_volume
        FROM markets
        WHERE id = market_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all volumes
CREATE FUNCTION recalculate_all_market_volumes()
RETURNS void AS $$
BEGIN
    WITH volume_calculation AS (
        SELECT 
            market_id,
            SUM(CASE 
                WHEN side = 'buy' THEN filled_amount * price
                WHEN side = 'sell' THEN -1 * (filled_amount * price)
            END) as total_volume,
            COUNT(*) as trades
        FROM orders
        WHERE status = 'filled'
        GROUP BY market_id
    )
    UPDATE markets m
    SET 
        total_volume = GREATEST(0, COALESCE(vc.total_volume, 0)),
        trades = COALESCE(vc.trades, 0),
        updated_at = NOW()
    FROM volume_calculation vc
    WHERE m.id = vc.market_id;
END;
$$ LANGUAGE plpgsql;
