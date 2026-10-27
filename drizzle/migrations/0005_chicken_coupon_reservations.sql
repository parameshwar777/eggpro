CREATE TABLE public.chicken_coupon_redemptions (
 phone text PRIMARY KEY CHECK (phone ~ '^[0-9]{10}$'),
 offer_id uuid NOT NULL REFERENCES public.offers(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
 user_id uuid NOT NULL,
 discount_amount numeric NOT NULL CHECK (discount_amount > 0),
 razorpay_order_id text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.chicken_coupon_redemptions TO service_role;
ALTER TABLE public.chicken_coupon_redemptions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.chicken_coupon_redemptions IS 'Server-only phone-wide chicken coupon reservations. Pending reservations resume the same order and never expire while payment remains possible.';
CREATE OR REPLACE FUNCTION public.reserve_chicken_coupon(p_phone text,p_offer_id uuid,p_order_id uuid,p_user_id uuid,p_discount numeric) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing public.chicken_coupon_redemptions%ROWTYPE; existing_order public.orders%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('chicken_coupon:' || p_phone,0));
 SELECT * INTO existing FROM public.chicken_coupon_redemptions WHERE phone=p_phone;
 IF FOUND THEN
  SELECT * INTO existing_order FROM public.orders WHERE id=existing.order_id;
  IF existing_order.payment_status='completed' THEN RETURN jsonb_build_object('error','This phone number has already used the chicken coupon'); END IF;
  IF existing.user_id IS DISTINCT FROM p_user_id THEN RETURN jsonb_build_object('error','This phone number already has a coupon order in progress'); END IF;
  RETURN jsonb_build_object('existingOrderId',existing.order_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id=p_order_id AND user_id=p_user_id AND phone=p_phone AND business='chicken' AND payment_status='pending') THEN RAISE EXCEPTION 'Invalid coupon order'; END IF;
 INSERT INTO public.chicken_coupon_redemptions(phone,offer_id,order_id,user_id,discount_amount) VALUES(p_phone,p_offer_id,p_order_id,p_user_id,p_discount);
 RETURN jsonb_build_object('reserved',true);
END; $$;
REVOKE ALL ON FUNCTION public.reserve_chicken_coupon(text,uuid,uuid,uuid,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_chicken_coupon(text,uuid,uuid,uuid,numeric) TO service_role;