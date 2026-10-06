ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chicken_staff';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS business text NOT NULL DEFAULT 'eggs';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_center_id uuid;

CREATE TABLE public.chicken_pickup_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_code text,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  latitude numeric,
  longitude numeric,
  google_maps_url text,
  image_path text,
  pickup_instructions text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.chicken_pickup_centers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chicken_pickup_centers TO authenticated;
GRANT ALL ON public.chicken_pickup_centers TO service_role;
ALTER TABLE public.chicken_pickup_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active centers" ON public.chicken_pickup_centers FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage centers" ON public.chicken_pickup_centers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.orders ADD CONSTRAINT orders_pickup_center_fk FOREIGN KEY (pickup_center_id) REFERENCES public.chicken_pickup_centers(id);

CREATE TABLE public.chicken_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  weight text,
  price numeric NOT NULL,
  offer_price numeric,
  image_path text,
  active boolean NOT NULL DEFAULT true,
  available boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.chicken_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chicken_products TO authenticated;
GRANT ALL ON public.chicken_products TO service_role;
ALTER TABLE public.chicken_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active chicken" ON public.chicken_products FOR SELECT USING ((active = true AND archived = false) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage chicken" ON public.chicken_products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.cafe_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  image_path text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.cafe_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cafe_locations TO authenticated;
GRANT ALL ON public.cafe_locations TO service_role;
ALTER TABLE public.cafe_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active cafes" ON public.cafe_locations FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage cafes" ON public.cafe_locations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chicken_pickup_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  customer_id uuid NOT NULL,
  pickup_center_id uuid NOT NULL REFERENCES public.chicken_pickup_centers(id),
  pickup_code text NOT NULL UNIQUE,
  pickup_status text NOT NULL DEFAULT 'PENDING_PICKUP',
  generated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid,
  verification_center_id uuid,
  handed_over_at timestamptz,
  handed_over_by uuid,
  expires_at timestamptz
);
CREATE INDEX idx_cpv_center ON public.chicken_pickup_verifications(pickup_center_id);
CREATE INDEX idx_cpv_customer ON public.chicken_pickup_verifications(customer_id);
GRANT SELECT, UPDATE ON public.chicken_pickup_verifications TO authenticated;
GRANT ALL ON public.chicken_pickup_verifications TO service_role;
ALTER TABLE public.chicken_pickup_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own pickup" ON public.chicken_pickup_verifications FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update pickup status" ON public.chicken_pickup_verifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.staff_centers (
  user_id uuid PRIMARY KEY,
  pickup_center_id uuid REFERENCES public.chicken_pickup_centers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_centers TO authenticated;
GRANT ALL ON public.staff_centers TO service_role;
ALTER TABLE public.staff_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view own center" ON public.staff_centers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage staff centers" ON public.staff_centers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write audit" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND actor_id = auth.uid());

CREATE TRIGGER trg_cpc_updated BEFORE UPDATE ON public.chicken_pickup_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cp_updated BEFORE UPDATE ON public.chicken_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cafe_updated BEFORE UPDATE ON public.cafe_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();