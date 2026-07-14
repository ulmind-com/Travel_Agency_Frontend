import { api } from "@/lib/api";
import { withId, type Booking } from "@/types/api";

export type BookingCreateSimpleInput = {
  package_id: string;
  travel_start_date: string;
  travelers: Array<{ traveler_type: string; name: string; phone?: string; email?: string }>;
  applied_promo_code?: string;
  files?: {
    photos: (File | null)[];
    documents: Array<Record<string, File>>;
  };
};

export const bookingsService = {
  async create(input: BookingCreateSimpleInput, lockId: string): Promise<Booking & { id: string }> {
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

    const { data } = await api.post<Booking>("/bookings", form);
    return withId(data);
  },

  async myBookings(): Promise<Array<Booking & { id: string }>> {
    const { data } = await api.get<Booking[]>("/bookings/my-bookings");
    return data.map(withId);
  },

  async requestCancel(bookingId: string): Promise<void> {
    await api.post(`/bookings/${bookingId}/request-cancel`);
  },
};