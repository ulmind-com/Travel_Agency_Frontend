import sikkim from "@/assets/dest-sundarban.jpg";
import agra from "@/assets/hero-tuscany.jpg";
import kerala from "@/assets/dest-kerala.jpg";
import manali from "@/assets/dest-himachal.jpg";
import ladakh from "@/assets/dest-ladakh.jpg";
import kashmir from "@/assets/dest-kashmir.jpg";

export type PopularTour = {
  id: string;
  name: string;
  rating: number; // 0-5
  ratingCount: number;
  days: number;
  ctaHref: string;
  imageUrl: string;
};

export type PopularToursContent = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  tours: PopularTour[];
};

const STORAGE_KEY = "ulmind_popular_tours_v1";

export const defaultPopularTours: PopularToursContent = {
  eyebrow: "Best Place For You",
  title: "Most Popular Tour",
  description:
    "Discover our most popular tours, designed to give you the best travel experience with breathtaking destinations, expert guides, and unforgettable memories.",
  ctaLabel: "Book Now",
  tours: [
    { id: "pt-sikkim", name: "Sikkim Tour Package", rating: 5, ratingCount: 4, days: 14, ctaHref: "/packages", imageUrl: sikkim },
    { id: "pt-agra", name: "Agra Tour Package", rating: 5, ratingCount: 5, days: 7, ctaHref: "/packages", imageUrl: agra },
    { id: "pt-kerala", name: "Kerala Tour Package", rating: 5, ratingCount: 4, days: 9, ctaHref: "/packages", imageUrl: kerala },
    { id: "pt-manali", name: "Manali Tour Package", rating: 5, ratingCount: 4, days: 14, ctaHref: "/packages", imageUrl: manali },
    { id: "pt-ladakh", name: "Ladakh Tour Package", rating: 5, ratingCount: 6, days: 10, ctaHref: "/packages", imageUrl: ladakh },
    { id: "pt-kashmir", name: "Kashmir Tour Package", rating: 5, ratingCount: 8, days: 8, ctaHref: "/packages", imageUrl: kashmir },
  ],
};

function isValid(c: unknown): c is PopularToursContent {
  if (!c || typeof c !== "object") return false;
  const t = (c as PopularToursContent).tours;
  return Array.isArray(t);
}

function readLocal(): PopularToursContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(c: PopularToursContent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent("ulmind:popular-tours-changed"));
  } catch {
    /* no-op */
  }
}

export const popularToursService = {
  async get(): Promise<PopularToursContent> {
    return readLocal() ?? defaultPopularTours;
  },
  async save(c: PopularToursContent): Promise<PopularToursContent> {
    writeLocal(c);
    return c;
  },
  async reset(): Promise<PopularToursContent> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("ulmind:popular-tours-changed"));
    }
    return defaultPopularTours;
  },
};