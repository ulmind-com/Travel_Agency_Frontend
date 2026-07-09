import arch1 from "@/assets/plan-arch-1.jpg";
import circleA1 from "@/assets/plan-circle-a-1.jpg";
import circleB1 from "@/assets/plan-circle-b-1.jpg";

export type PlanFeature = {
  id: string;
  title: string;
  description: string;
};

export type PlanSlots = {
  arch: string;
  circleA: string;
  circleB: string;
};

export type PlanYourTripContent = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  features: PlanFeature[];
  slots: PlanSlots;
};

const STORAGE_KEY = "ulmind_plan_your_trip_v2";

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
    arch: arch1,
    circleA: circleA1,
    circleB: circleB1,
  },
};

function isValid(c: unknown): c is PlanYourTripContent {
  if (!c || typeof c !== "object") return false;
  const s = (c as PlanYourTripContent).slots;
  return (
    !!s &&
    typeof s.arch === "string" &&
    typeof s.circleA === "string" &&
    typeof s.circleB === "string"
  );
}

function readLocal(): PlanYourTripContent | null {
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