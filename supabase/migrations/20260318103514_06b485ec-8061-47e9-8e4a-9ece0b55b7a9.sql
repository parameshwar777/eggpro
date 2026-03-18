
-- Allow merchants to view all orders
CREATE POLICY "Merchants can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'merchant'::app_role));

-- Allow merchants to update orders (status changes)
CREATE POLICY "Merchants can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'merchant'::app_role));
