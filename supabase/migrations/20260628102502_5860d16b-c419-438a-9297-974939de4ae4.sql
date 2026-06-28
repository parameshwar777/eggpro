ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;

-- Tighten the read policy so only offers active and within date range are publicly visible
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
CREATE POLICY "Anyone can view active offers"
  ON public.offers
  FOR SELECT
  USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  );