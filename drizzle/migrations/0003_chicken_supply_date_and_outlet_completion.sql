ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS chicken_supply_at timestamptz;
UPDATE public.orders o SET chicken_supply_at = COALESCE(v.expires_at, (((date_trunc('day', o.created_at AT TIME ZONE 'Asia/Kolkata') + (((7 - extract(dow from o.created_at AT TIME ZONE 'Asia/Kolkata')::int) % 7) || ' days')::interval + interval '10 hours') AT TIME ZONE 'Asia/Kolkata'))) FROM public.chicken_pickup_verifications v WHERE o.id = v.order_id AND o.business = 'chicken' AND o.chicken_supply_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_chicken_supply_outlet_idx ON public.orders(chicken_supply_at,pickup_center_id) WHERE business='chicken';
CREATE OR REPLACE FUNCTION public.complete_chicken_outlet_order(p_order_id uuid, p_outlet_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE; v public.chicken_pickup_verifications%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'merchant')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.business <> 'chicken' OR o.payment_status IS DISTINCT FROM 'completed' OR o.fulfillment_type <> 'pickup' OR o.pickup_center_id IS DISTINCT FROM p_outlet_id OR o.order_status='cancelled' THEN RAISE EXCEPTION 'This paid pickup order does not belong to the selected outlet'; END IF;
 SELECT * INTO v FROM public.chicken_pickup_verifications WHERE order_id=o.id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pickup details are not available'; END IF;
 IF v.pickup_status='HANDED_OVER' THEN RETURN jsonb_build_object('ok',true,'alreadyDone',true); END IF;
 IF v.pickup_status IN ('CANCELLED','EXPIRED') OR v.expires_at <= now() THEN RAISE EXCEPTION 'This pickup is cancelled or past its collection deadline'; END IF;
 UPDATE public.chicken_pickup_verifications SET pickup_status='HANDED_OVER',handed_over_at=now(),handed_over_by=auth.uid() WHERE id=v.id;
 UPDATE public.orders SET order_status='delivered',updated_at=now() WHERE id=o.id;
 INSERT INTO public.admin_audit_log(actor_id,entity,entity_id,action,details) VALUES(auth.uid(),'chicken_pickup',v.id::text,'outlet_mark_done',jsonb_build_object('orderId',o.id,'outletId',p_outlet_id));
 RETURN jsonb_build_object('ok',true,'alreadyDone',false);
END;
$$;
REVOKE ALL ON FUNCTION public.complete_chicken_outlet_order(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_chicken_outlet_order(uuid,uuid) TO authenticated;
COMMENT ON TABLE public.staff_centers IS 'DEPRECATED: chicken staff interface replaced by admin/merchant weekly outlet orders';