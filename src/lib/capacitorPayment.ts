/**
 * Opens Razorpay payment in system browser for Capacitor native apps.
 * Falls back to inline checkout for web.
 */
export function isCapacitorNative(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function openInSystemBrowser(url: string) {
  // In Capacitor, creating an anchor with target="_blank" opens in system browser
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface PaymentPageParams {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  dbOrderId: string;
  email: string;
  phone: string;
  description: string;
  extraData: Record<string, any>;
}

export function buildPaymentPageUrl(params: PaymentPageParams): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const extraB64 = btoa(JSON.stringify(params.extraData));

  const searchParams = new URLSearchParams({
    key: params.keyId,
    orderId: params.razorpayOrderId,
    amount: String(params.amount),
    dbOrderId: params.dbOrderId,
    email: params.email,
    phone: params.phone,
    desc: params.description,
    extra: extraB64,
  });

  return `${supabaseUrl}/functions/v1/razorpay-checkout-page?${searchParams.toString()}`;
}
