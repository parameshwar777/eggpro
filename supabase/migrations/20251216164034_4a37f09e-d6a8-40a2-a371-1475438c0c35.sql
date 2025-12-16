-- Enable RLS to protect OTP hashes
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: deny all access via client/API.
-- Service-role (used by backend functions) bypasses RLS.