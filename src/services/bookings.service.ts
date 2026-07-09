import { api } from "@/lib/api";
import { withId, type Booking } from "@/types/api";

export type BookingCreateSimpleInput = {
  package_id: string;
  travel_start_date: string;
  travelers_count: number;
  applied_promo_code?: string;
};

export const bookingsService = {
  async create(input: BookingCreateSimpleInput, lockId: string): Promise<Booking & { id: string }> {
    const form = new FormData();
    form.append("booking_data", JSON.stringify(input));
    form.append("lock_id", lockId);
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