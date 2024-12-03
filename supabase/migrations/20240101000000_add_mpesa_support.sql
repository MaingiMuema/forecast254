-- Add M-Pesa related columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT,
ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;

-- Create function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
