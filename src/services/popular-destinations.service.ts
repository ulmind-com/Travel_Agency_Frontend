import himachal from "@/assets/dest-himachal.jpg";
import andaman from "@/assets/dest-andaman.jpg";
import sundarban from "@/assets/dest-sundarban.jpg";
import kashmir from "@/assets/dest-kashmir.jpg";
import ladakh from "@/assets/dest-ladakh.jpg";
import kerala from "@/assets/dest-kerala.jpg";
import rajasthan from "@/assets/dest-rajasthan.jpg";

export type PopularDestination = {
  id: string;
  name: string;
  listingCount: number;
  imageUrl: string;
};

const STORAGE_KEY = "ulmind_popular_destinations_v1";

export const defaultPopularDestinations: PopularDestination[] = [
  { id: "def-himachal", name: "Himachal", listingCount: 1, imageUrl: himachal },
  { id: "def-andaman", name: "Andaman", listingCount: 2, imageUrl: andaman },
  { id: "def-sundarban", name: "Sundarban", listingCount: 1, imageUrl: sundarban },
  { id: "def-kashmir", name: "Kashmir", listingCount: 3, imageUrl: kashmir },
  { id: "def-ladakh", name: "Ladakh", listingCount: 2, imageUrl: ladakh },
  { id: "def-kerala", name: "Kerala", listingCount: 2, imageUrl: kerala },
  { id: "def-rajasthan", name: "Rajasthan", listingCount: 4, imageUrl: rajasthan },
];

function readLocal(): PopularDestination[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PopularDestination[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(items: PopularDestination[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("ulmind:popular-destinations-changed"));
  } catch {
    /* no-op */
  }
}

export const popularDestinationsService = {
  async list(): Promise<PopularDestination[]> {
    return readLocal() ?? defaultPopularDestinations;
  },
  async save(items: PopularDestination[]): Promise<PopularDestination[]> {
    writeLocal(items);
    return items;
  },
  async reset(): Promise<PopularDestination[]> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("ulmind:popular-destinations-changed"));
    }
    return defaultPopularDestinations;
  },
};