export type AchievementStat = {
  id: string;
  value: string;
  label: string;
};

export type AchievementsContent = {
  eyebrow: string;
  title: string;
  stats: AchievementStat[];
};

const STORAGE_KEY = "ulmind_achievements_v1";

export const defaultAchievements: AchievementsContent = {
  eyebrow: "",
  title: "",
  stats: [
    { id: "st-1", value: "12", label: "Years Experience" },
    { id: "st-2", value: "97%", label: "Retention Rate" },
    { id: "st-3", value: "8k", label: "Tour Completed" },
    { id: "st-4", value: "19k", label: "Happy Travellers" },
  ],
};

function isValid(c: unknown): c is AchievementsContent {
  if (!c || typeof c !== "object") return false;
  const s = (c as AchievementsContent).stats;
  return Array.isArray(s) && s.length === 4;
}

function readLocal(): AchievementsContent | null {
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

function writeLocal(c: AchievementsContent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent("ulmind:achievements-changed"));
  } catch {
    /* no-op */
  }
}

export const achievementsService = {
  async get(): Promise<AchievementsContent> {
    return readLocal() ?? defaultAchievements;
  },
  async save(c: AchievementsContent): Promise<AchievementsContent> {
    writeLocal(c);
    return c;
  },
  async reset(): Promise<AchievementsContent> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("ulmind:achievements-changed"));
    }
    return defaultAchievements;
  },
};