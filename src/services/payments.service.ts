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
  travelers: Array<{ traveler_type: string; name: string; phone?: string; email?: string }>;
  applied_promo_code?: string;
  files?: {
    photos: (File | null)[];
    documents: Array<Record<string, File>>;
  };
};

export type PaymentVerifyInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  lock_id: string;
  package_id: string;
};

export const paymentsService = {
  async initiate(input: PaymentInitiateInput, lockId: string): Promise<PaymentInitiateResult> {
    const form = new FormData();
    const { files, ...jsonData } = input;
    
    form.append("booking_data", JSON.stringify(jsonData));
    form.append("lock_id", lockId);

    if (files) {
      files.photos.forEach((file, i) => {
        if (file) form.append(`traveler_${i}_photo`, file);
      });
      files.documents.forEach((docs, i) => {
        if (docs) {
          Object.entries(docs).forEach(([docName, file]) => {
            if (file) form.append(`traveler_${i}_doc_${docName}`, file);
          });
        }
      });
    }

    const { data } = await api.post<PaymentInitiateResult>("/payments/initiate", form);
    return data;
  },

  async verify(input: PaymentVerifyInput) {
    const { data } = await api.post("/payments/verify", input);
    return data;
  },
};