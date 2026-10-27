ALTER TABLE public.offers ADD COLUMN product_id uuid;
ALTER TABLE public.offers ADD CONSTRAINT offers_product_business_check CHECK (product_id IS NULL OR business IN ('eggs', 'chicken'));
COMMENT ON COLUMN public.offers.product_id IS 'Optional exact product/weight variant eligible for this coupon; products for eggs, chicken_products for chicken. NULL preserves business-wide offers.';