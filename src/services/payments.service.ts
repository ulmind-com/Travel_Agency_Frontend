import { api } from "@/lib/api";

export type PaymentInitiateResult = {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id?: string;
};

export type PaymentInitiateInput = {
  package_id: string;
  travel_start_date: string;
  travelers_count: number;
  applied_promo_code?: string;
};

export type PaymentVerifyInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  lock_id: string;
};

export const paymentsService = {
  async initiate(input: PaymentInitiateInput, lockId: string): Promise<PaymentInitiateResult> {
    const form = new FormData();
    form.append("booking_data", JSON.stringify(input));
    form.append("lock_id", lockId);
    const { data } = await api.post<PaymentInitiateResult>("/payments/initiate", form);
    return data;
  },

  async verify(input: PaymentVerifyInput) {
    const { data } = await api.post("/payments/verify", input);
    return data;
  },
};