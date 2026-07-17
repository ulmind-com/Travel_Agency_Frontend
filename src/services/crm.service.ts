import { api } from "@/lib/api";
import type {
  GlobalSearchResponse, SearchSuggestions, FilterFacets,
  IntelListResponse, IntelDetail, CrmListParams,
} from "@/types/admin.crm";

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== "ALL") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ── Global Search ────────────────────────────────────────────────────────
export const searchService = {
  search: async (q: string, limit = 5): Promise<GlobalSearchResponse> => {
    const { data } = await api.get(`/admin/search${qs({ q, limit })}`);
    return data;
  },
  suggestions: async (q?: string): Promise<SearchSuggestions> => {
    const { data } = await api.get(`/admin/search/suggestions${qs({ q })}`);
    return data;
  },
  history: async (): Promise<{ items: string[] }> => {
    const { data } = await api.get("/admin/search/history");
    return data;
  },
  clearHistory: async () => {
    const { data } = await api.delete("/admin/search/history");
    return data;
  },
};

// ── Customer Intelligence ────────────────────────────────────────────────
export const crmService = {
  facets: async (): Promise<FilterFacets> => {
    const { data } = await api.get("/admin/filters");
    return data;
  },
  health: async (params: CrmListParams): Promise<IntelListResponse> => {
    const { data } = await api.get(`/admin/customer-health${qs(params as Record<string, unknown>)}`);
    return data;
  },
  healthDetail: async (userId: string): Promise<IntelDetail> => {
    const { data } = await api.get(`/admin/customer-health/${userId}`);
    return data;
  },
  loyalty: async (params: CrmListParams): Promise<IntelListResponse> => {
    const { data } = await api.get(`/admin/loyalty${qs(params as Record<string, unknown>)}`);
    return data;
  },
  loyaltyDetail: async (userId: string): Promise<IntelDetail> => {
    const { data } = await api.get(`/admin/loyalty/${userId}`);
    return data;
  },
  fraud: async (params: CrmListParams): Promise<IntelListResponse> => {
    const { data } = await api.get(`/admin/fraud${qs(params as Record<string, unknown>)}`);
    return data;
  },
  fraudDetail: async (userId: string): Promise<IntelDetail> => {
    const { data } = await api.get(`/admin/fraud/${userId}`);
    return data;
  },
  // SUPER_ADMIN actions
  overrideFraud: async (userId: string, level: string | null, reason: string) => {
    const { data } = await api.patch(`/admin/fraud/${userId}/override`, { level, reason });
    return data;
  },
  overrideTier: async (userId: string, tier: string | null, reason: string) => {
    const { data } = await api.patch(`/admin/loyalty/${userId}/tier`, { tier, reason });
    return data;
  },
  redeemPoints: async (userId: string, points: number, reason: string) => {
    const { data } = await api.post(`/admin/loyalty/${userId}/redeem`, { points, reason });
    return data;
  },
  resetHealth: async (userId: string) => {
    const { data } = await api.post(`/admin/customer-health/${userId}/reset`);
    return data;
  },
};
