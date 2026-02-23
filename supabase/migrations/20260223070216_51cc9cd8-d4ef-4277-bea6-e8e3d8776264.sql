
-- Add pincode to communities for auto-fill in address
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS pincode text DEFAULT '';

-- Add production visibility flag for admin to control which communities show in app
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_visible_production boolean DEFAULT false;
