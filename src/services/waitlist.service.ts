import { api } from "@/lib/api";

export const waitlistService = {
  async join(packageId: string) {
    const { data } = await api.post(`/waitlist/${packageId}/join`);
    return data;
  },
};