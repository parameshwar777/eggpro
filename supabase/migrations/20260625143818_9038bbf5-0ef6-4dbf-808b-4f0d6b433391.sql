CREATE TABLE IF NOT EXISTS public.phone_otps (
  phone TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.phone_otps TO service_role;
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.phone_otps FOR ALL USING (false) WITH CHECK (false);