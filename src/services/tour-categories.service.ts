import seaBeach from "@/assets/tour-cat-sea-beach.jpg";
import pilgrimage from "@/assets/tour-cat-pilgrimage.jpg";
import wildlife from "@/assets/tour-cat-wildlife.jpg";
import hillStations from "@/assets/tour-cat-hill-stations.jpg";
import heritage from "@/assets/tour-cat-heritage.jpg";
import adventure from "@/assets/tour-cat-adventure.jpg";
import honeymoon from "@/assets/tour-cat-honeymoon.jpg";

import type { PackageCategory } from "@/types/api";

export type TourCategory = {
  id: string;
  name: string;
  imageUrl: string;
  category: PackageCategory;
};

const STORAGE_KEY = "ulmind_tour_categories_v1";

export const defaultTourCategories: TourCategory[] = [
  { id: "def-sea-beach", name: "Sea Beach", imageUrl: seaBeach, category: "BEACH" },
  { id: "def-pilgrimage", name: "Pilgrimage", imageUrl: pilgrimage, category: "PILGRIMAGE" },
  { id: "def-wildlife", name: "Wildlife", imageUrl: wildlife, category: "WILDLIFE" },
  { id: "def-hill-stations", name: "Hill Stations", imageUrl: hillStations, category: "MOUNTAIN" },
  { id: "def-heritage", name: "Heritage", imageUrl: heritage, category: "HERITAGE" },
  { id: "def-adventure", name: "Adventure", imageUrl: adventure, category: "ADVENTURE" },
  { id: "def-honeymoon", name: "Honeymoon", imageUrl: honeymoon, category: "HONEYMOON" },
];

function readLocal(): TourCategory[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TourCategory[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(items: TourCategory[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("ulmind:tour-categories-changed"));
  } catch {
    /* no-op */
  }
}

export const tourCategoriesService = {
  async list(): Promise<TourCategory[]> {
    return readLocal() ?? defaultTourCategories;
  },
  async save(items: TourCategory[]): Promise<TourCategory[]> {
    writeLocal(items);
    return items;
  },
  async reset(): Promise<TourCategory[]> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("ulmind:tour-categories-changed"));
    }
    return defaultTourCategories;
  },
};