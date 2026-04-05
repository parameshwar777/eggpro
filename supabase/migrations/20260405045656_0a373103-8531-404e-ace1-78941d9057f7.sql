ALTER TABLE public.products ADD COLUMN buy_once_price numeric NULL;

-- Set existing buy_once_price to original_price (which was previously used as buy-once)
UPDATE public.products SET buy_once_price = original_price WHERE original_price IS NOT NULL;
UPDATE public.products SET buy_once_price = price WHERE buy_once_price IS NULL;