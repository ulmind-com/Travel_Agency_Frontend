import { api } from "@/lib/api";
import { withId, type Package, type PackageCategory } from "@/types/api";

export type PublicPackageFilters = {
  destination?: string;
  min_price?: number;
  max_price?: number;
  category?: PackageCategory;
};

function normalize(p: Package): Package & { id: string } {
  return withId(p);
}

export const packagesService = {
  async list(activeOnly = true): Promise<Array<Package & { id: string }>> {
    const { data } = await api.get<Package[]>("/packages", {
      params: { is_active_only: activeOnly },
    });
    return data.map(normalize);
  },

  async publicSearch(
    filters: PublicPackageFilters = {},
  ): Promise<Array<Package & { id: string }>> {
    const { data } = await api.get<Package[]>("/public/packages", {
      params: filters,
    });
    return data.map(normalize);
  },

  async detail(id: string): Promise<Package & { id: string }> {
    const { data } = await api.get<Package>(`/packages/${id}`);
    return normalize(data);
  },
};