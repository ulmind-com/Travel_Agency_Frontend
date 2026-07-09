import { api } from "@/lib/api";

export type LockSeatsResult = {
  lock_id: string;
  expires_at?: string;
};

export const inventoryService = {
  async lockSeats(packageId: string, requestedSeats: number): Promise<LockSeatsResult> {
    const { data } = await api.post<LockSeatsResult>("/inventory/lock-seats", {
      package_id: packageId,
      requested_seats: requestedSeats,
    });
    return data;
  },
};