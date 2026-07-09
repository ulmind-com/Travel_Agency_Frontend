import arch1 from "@/assets/plan-arch-1.jpg";
import arch2 from "@/assets/plan-arch-2.jpg";
import circleA1 from "@/assets/plan-circle-a-1.jpg";
import circleA2 from "@/assets/plan-circle-a-2.jpg";
import circleB1 from "@/assets/plan-circle-b-1.jpg";
import circleB2 from "@/assets/plan-circle-b-2.jpg";

export type PlanPhoto = { id: string; imageUrl: string };

export type PlanFeature = {
  id: string;
  title: string;
  description: string;
};

export type PlanYourTripContent = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  features: PlanFeature[];
  slots: {
    arch: PlanPhoto[];
    circleA: PlanPhoto[];
    circleB: PlanPhoto[];
  };
};

const STORAGE_KEY = "ulmind_plan_your_trip_v1";

export const defaultPlanYourTrip: PlanYourTripContent = {
  eyebrow: "Let's Go Together",
  title: "Plan Your Trip With Us",
  description:
    "Ulmind Travel curates comfortable, quietly luxurious itineraries — whether you are planning a private family holiday, a considered honeymoon, or a solo escape, every detail is composed for a smooth, memorable journey.",
  ctaLabel: "Learn More",
  ctaHref: "/packages",
  features: [
    {
      id: "feat-exclusive",
      title: "Exclusive Trips",
      description:
        "Bespoke journeys designed around your pace and taste, ensuring each stay, drive and dining moment feels quietly one-of-a-kind.",
    },
    {
      id: "feat-guide",
      title: "Professional Guides",
      description:
        "Local experts who move gently through each destination, sharing informed context and small, off-map discoveries along the way.",
    },
  ],
  slots: {
    arch: [
      { id: "arch-1", imageUrl: arch1 },
      { id: "arch-2", imageUrl: arch2 },
    ],
    circleA: [
      { id: "ca-1", imageUrl: circleA1 },
      { id: "ca-2", imageUrl: circleA2 },
    ],
    circleB: [
      { id: "cb-1", imageUrl: circleB1 },
      { id: "cb-2", imageUrl: circleB2 },
    ],
  },
};

function readLocal(): PlanYourTripContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanYourTripContent;
    if (!parsed || !parsed.slots) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(content: PlanYourTripContent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    window.dispatchEvent(new CustomEvent("ulmind:plan-your-trip-changed"));
  } catch {
    /* no-op */
  }
}

export const planYourTripService = {
  async get(): Promise<PlanYourTripContent> {
    return readLocal() ?? defaultPlanYourTrip;
  },
  async save(content: PlanYourTripContent): Promise<PlanYourTripContent> {
    writeLocal(content);
    return content;
  },
  async reset(): Promise<PlanYourTripContent> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("ulmind:plan-your-trip-changed"));
    }
    return defaultPlanYourTrip;
  },
};