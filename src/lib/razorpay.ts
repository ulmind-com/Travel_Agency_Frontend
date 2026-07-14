let loading: Promise<boolean> | null = null;

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on?: (evt: string, cb: (e: unknown) => void) => void };
  }
}

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
  config?: {
    display?: {
      blocks?: Record<string, { name: string; instruments: Array<{ method: string; banks?: string[]; wallets?: string[] }> }>;
      sequence?: string[];
      preferences?: { show_default_blocks?: boolean };
    };
  };
  method?: {
    upi?: boolean | { flow?: string };
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
    paylater?: boolean;
    qr?: boolean;
  };
};

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return loading;
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  const ok = await loadRazorpay();
  if (!ok || !window.Razorpay) {
    throw new Error("Payment gateway failed to load");
  }
  const rz = new window.Razorpay(options);
  rz.open();
}