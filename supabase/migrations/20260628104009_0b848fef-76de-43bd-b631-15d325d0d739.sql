
ALTER TABLE public.payment_issues 
  ADD COLUMN IF NOT EXISTS ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS order_screenshot_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS payment_issues_ticket_number_key ON public.payment_issues(ticket_number) WHERE ticket_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_payment_issue_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || to_char(now(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(NEW.id::text || clock_timestamp()::text) FROM 1 FOR 5));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_issues_ticket ON public.payment_issues;
CREATE TRIGGER trg_payment_issues_ticket
BEFORE INSERT ON public.payment_issues
FOR EACH ROW EXECUTE FUNCTION public.set_payment_issue_ticket_number();
