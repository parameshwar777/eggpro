-- Add customer_name column to orders table to store user info
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;

-- Add subscription_end_date column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;