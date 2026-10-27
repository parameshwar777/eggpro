export function chickenCheckoutError(name: string, phone: string, itemCount: number): { field: 'phone' | 'name' | 'items'; message: string } | null {
  if (!/^\d{10}$/.test(phone)) return { field: 'phone', message: 'Enter a valid 10-digit phone number' };
  if (name.trim().length < 2 || name.trim().length > 100) return { field: 'name', message: 'Enter your full name (2–100 characters)' };
  if (itemCount < 1) return { field: 'items', message: 'Select a product' };
  return null;
}