-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  full_name TEXT,
  community TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  unit TEXT DEFAULT '6 Eggs',
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  community TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active notifications" ON public.notifications
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers" ON public.offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage offers" ON public.offers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.phone
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial products
INSERT INTO public.products (name, description, price, original_price, unit, image_url) VALUES
('Country Eggs', 'Farm fresh country eggs, rich in nutrients', 60.00, 72.00, '6 Eggs', 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400'),
('Country Eggs', 'Farm fresh country eggs, rich in nutrients', 120.00, 144.00, '12 Eggs', 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400'),
('Country Eggs', 'Farm fresh country eggs, rich in nutrients', 290.00, 360.00, '30 Eggs', 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400'),
('White Eggs', 'Premium white eggs, perfect for daily use', 42.00, 48.00, '6 Eggs', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'),
('White Eggs', 'Premium white eggs, perfect for daily use', 84.00, 96.00, '12 Eggs', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'),
('White Eggs', 'Premium white eggs, perfect for daily use', 200.00, 240.00, '30 Eggs', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'),
('Brown Eggs', 'Organic brown eggs from free-range hens', 54.00, 60.00, '6 Eggs', 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=400'),
('Brown Eggs', 'Organic brown eggs from free-range hens', 108.00, 120.00, '12 Eggs', 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=400'),
('Brown Eggs', 'Organic brown eggs from free-range hens', 260.00, 300.00, '30 Eggs', 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=400');