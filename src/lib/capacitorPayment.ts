/**
 * Razorpay payment helper.
 * On Capacitor native → uses native Razorpay SDK (capacitor-razorpay) for full UPI app support.
 * On web → uses inline checkout.js.
 */

export function isCapacitorNative(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

interface RazorpayPaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { email?: string; contact?: string };
  theme?: { color: string };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Opens Razorpay checkout using native SDK on Capacitor or inline on web.
 * Returns the payment response on success, throws on failure/cancel.
 */
export async function openRazorpayCheckout(options: RazorpayPaymentOptions): Promise<RazorpayResponse> {
  if (isCapacitorNative()) {
    // Use native Razorpay SDK via capacitor-razorpay plugin
    const { Checkout } = await import("capacitor-razorpay");
    const result = await Checkout.open(options);
    // The native plugin returns response inside `response` property as JSON string
    const response = typeof result.response === "string" ? JSON.parse(result.response) : result.response;
    return {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    };
  }

  // Web: use inline Razorpay checkout
  return new Promise<RazorpayResponse>((resolve, reject) => {
    const razorpay = new (window as any).Razorpay({
      ...options,
      handler: (response: RazorpayResponse) => resolve(response),
      modal: {
        escape: false,
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });
    razorpay.open();
  });
}
