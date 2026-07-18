import { api } from "@/lib/api";

export type LockSeatsResult = {
  lock_id: string;
  expires_at?: string;
};

export type AvailabilityStatus = "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "OPEN";

export type Availability = {
  package_id: string;
  is_seat_based: boolean;
  total_seats: number;
  booked_seats: number;
  held_seats: number;
  remaining_seats: number;
  booking_progress_pct: number;
  status: AvailabilityStatus;
  recently_booked: number;
  updated_at: string;
};

export const inventoryService = {
  async lockSeats(packageId: string, requestedSeats: number): Promise<LockSeatsResult> {
    const { data } = await api.post<LockSeatsResult>("/inventory/lock-seats", {
      package_id: packageId,
      requested_seats: requestedSeats,
    });
    return data;
  },

  /** Live seat availability for a package — computed server-side from real
   *  inventory + Redis holds. Safe to poll from the public package page. */
  async availability(packageId: string): Promise<Availability> {
    const { data } = await api.get<Availability>(`/inventory/availability/${packageId}`);
    return data;
  },
};
