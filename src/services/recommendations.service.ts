import { api } from "@/lib/api";
import { withId, type Package } from "@/types/api";

export const recommendationsService = {
  async trending(limit = 6) {
    const { data } = await api.get<Package[]>("/recommendations/trending", {
      params: { limit },
    });
    return data.map(withId);
  },
  async personalized(limit = 6) {
    const { data } = await api.get<Package[]>("/recommendations/personalized", {
      params: { limit },
    });
    return data.map(withId);
  },
};