import { api } from "@/lib/api";
import { withId, type Review } from "@/types/api";

export const reviewsService = {
  async listForPackage(packageId: string): Promise<Array<Review & { id: string }>> {
    const { data } = await api.get<Review[]>(`/reviews/package/${packageId}`);
    return (data ?? []).map(withId);
  },
  async create(packageId: string, input: { rating: number; comment: string }) {
    const { data } = await api.post(`/reviews/package/${packageId}`, input);
    return data;
  },
};