-- Add payment_method column to transactions table
ALTER TABLE transactions 
ADD COLUMN payment_method TEXT;

-- Comment on column
COMMENT ON COLUMN transactions.payment_method IS 'Payment method: 现金, 信用卡, PayPay残高, 积分';
