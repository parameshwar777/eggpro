
CREATE TABLE public.payment_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id TEXT,
  amount NUMERIC,
  description TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_issues TO authenticated;
GRANT ALL ON public.payment_issues TO service_role;

ALTER TABLE public.payment_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment issues"
  ON public.payment_issues FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own payment issues"
  ON public.payment_issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payment issues"
  ON public.payment_issues FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_issues_updated_at
  BEFORE UPDATE ON public.payment_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
