import santoriniImg from "@/assets/hero-slide-santorini.jpg";
import kyotoImg from "@/assets/hero-slide-kyoto.jpg";
import maldivesImg from "@/assets/hero-slide-maldives.jpg";
import alpsImg from "@/assets/hero-slide-alps.jpg";
import rajasthanImg from "@/assets/hero-slide-rajasthan.jpg";
import icelandImg from "@/assets/hero-slide-iceland.jpg";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  eyebrow: string;
  headlinePrefix: string;
  headlineAccent: string;
  subtitle: string;
};

const STORAGE_KEY = "ulmind_hero_slides_v1";

export const defaultHeroSlides: HeroSlide[] = [
  {
    id: "default-santorini",
    imageUrl: santoriniImg,
    eyebrow: "The 2026 Portfolio · Cyclades",
    headlinePrefix: "The geography",
    headlineAccent: "of silence.",
    subtitle:
      "Cliffside caldera villas in Oia — golden hour, chartered yachts, and Aegean quiet.",
  },
  {
    id: "default-kyoto",
    imageUrl: kyotoImg,
    eyebrow: "Arashiyama · Kyoto",
    headlinePrefix: "Light through",
    headlineAccent: "the bamboo.",
    subtitle:
      "Dawn walks, ryokan stays, and tea ceremonies composed by our on-ground curators.",
  },
  {
    id: "default-maldives",
    imageUrl: maldivesImg,
    eyebrow: "North Malé Atoll · Maldives",
    headlinePrefix: "A private",
    headlineAccent: "lagoon of one.",
    subtitle:
      "Overwater villas, house reef diving, and a candle-lit dinner on your own sandbank.",
  },
  {
    id: "default-alps",
    imageUrl: alpsImg,
    eyebrow: "Zermatt · Swiss Alps",
    headlinePrefix: "Snowlight",
    headlineAccent: "at dusk.",
    subtitle:
      "Chalet residencies with private ski instructors and Matterhorn-facing terraces.",
  },
  {
    id: "default-rajasthan",
    imageUrl: rajasthanImg,
    eyebrow: "Udaipur · Rajasthan",
    headlinePrefix: "Palace hours,",
    headlineAccent: "lantern quiet.",
    subtitle:
      "Heritage haveli residencies, private zenana dinners, and lake-facing courtyards.",
  },
  {
    id: "default-iceland",
    imageUrl: icelandImg,
    eyebrow: "Reynisfjara · South Iceland",
    headlinePrefix: "The edge of",
    headlineAccent: "the map.",
    subtitle:
      "Basalt shores, glacier helicopters, and aurora-lit lodges through the long winter.",
  },
];

import { api } from "@/lib/api";

export const heroSlidesService = {
  async list(): Promise<HeroSlide[]> {
    try {
      const { data } = await api.get<{ data: any }>("/cms/hero_slides");
      if (data.data && Array.isArray(data.data.slides) && data.data.slides.length > 0) {
        return data.data.slides as HeroSlide[];
      }
    } catch {
      // fallback if API fails
    }
    return defaultHeroSlides;
  },
  async save(slides: HeroSlide[]): Promise<HeroSlide[]> {
    const { data } = await api.post<{ data: any }>("/cms/hero_slides", {
      data: { slides },
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ulmind:hero-slides-changed"));
    }
    return data.data.slides as HeroSlide[];
  },
  async reset(): Promise<HeroSlide[]> {
    await api.delete("/cms/hero_slides");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ulmind:hero-slides-changed"));
    }
    return defaultHeroSlides;
  },
};