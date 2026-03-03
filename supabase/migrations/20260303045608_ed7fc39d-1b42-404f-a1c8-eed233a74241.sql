
-- Add app version setting
INSERT INTO public.admin_settings (key, value) 
VALUES ('app_current_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;
