import { api } from "@/lib/api";
import { withId, type Package } from "@/types/api";

export const wishlistService = {
  async list(): Promise<Array<Package & { id: string }>> {
    const { data } = await api.get<Package[]>("/users/wishlist");
    return data.map(withId);
  },
  async toggle(packageId: string): Promise<void> {
    await api.post(`/users/wishlist/${packageId}`);
  },
};