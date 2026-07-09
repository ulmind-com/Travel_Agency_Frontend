export type GallerySlot = {
  id: string;
  imageUrl: string;
  alt: string;
};

import gallery1 from "@/assets/gallery-1_sikkim-clean.jpg";
import gallery2 from "@/assets/gallery-2_kashmir-clean.jpg";
import gallery3 from "@/assets/gallery-3_lakshadweep-clean.jpg";
import gallery4 from "@/assets/gallery-4_darjeeling-clean.jpg";
import gallery5 from "@/assets/gallery-5_vietnam-clean.jpg";

export type RecentGalleryContent = {
  eyebrow: string;
  title: string;
  slots: GallerySlot[]; // exactly 5
};

const STORAGE_KEY = "ulmind_recent_gallery_v3";

export const defaultRecentGallery: RecentGalleryContent = {
  eyebrow: "Make Your Tour More Pleasure",
  title: "Recent Gallery",
  slots: [
    { id: "rg-1", imageUrl: gallery1, alt: "Sikkim adventure tour" },
    { id: "rg-2", imageUrl: gallery2, alt: "Explore Kashmir" },
    { id: "rg-3", imageUrl: gallery3, alt: "Escape to Lakshadweep island bliss" },
    { id: "rg-4", imageUrl: gallery4, alt: "Darjeeling offbeat travel" },
    { id: "rg-5", imageUrl: gallery5, alt: "Vietnam journey" },
  ],
};

function isValid(c: unknown): c is RecentGalleryContent {
  if (!c || typeof c !== "object") return false;
  const s = (c as RecentGalleryContent).slots;
  return Array.isArray(s);
}

function readLocal(): RecentGalleryContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) return null;
    // ensure exactly 5 slots
    const slots = [...parsed.slots];
    while (slots.length < 5) {
      slots.push({ id: `rg-${slots.length + 1}`, imageUrl: "", alt: `Gallery image ${slots.length + 1}` });
    }
    return { ...parsed, slots: slots.slice(0, 5) };
  } catch {
    return null;
  }
}

function writeLocal(c: RecentGalleryContent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent("ulmind:recent-gallery-changed"));
  } catch {
    /* no-op */
  }
}

export const recentGalleryService = {
  async get(): Promise<RecentGalleryContent> {
    return readLocal() ?? defaultRecentGallery;
  },
  async save(c: RecentGalleryContent): Promise<RecentGalleryContent> {
    writeLocal(c);
    return c;
  },
  async reset(): Promise<RecentGalleryContent> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("ulmind:recent-gallery-changed"));
    }
    return defaultRecentGallery;
  },
};