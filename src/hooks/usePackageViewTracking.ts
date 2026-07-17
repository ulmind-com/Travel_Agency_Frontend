import { useEffect } from "react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const VISITOR_KEY = "ulmind_visitor_id";

/** Stable anonymous visitor id, persisted across sessions. */
function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2, 12);
  }
}

function sourceOf(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname;
    if (host === window.location.hostname) return "internal";
    if (/google\./.test(host)) return "google";
    if (/facebook|instagram|twitter|x\.com|linkedin|youtube/.test(host)) return "social";
    return "referral";
  } catch {
    return "direct";
  }
}

/**
 * Fire-and-forget package impression tracking — feeds the Package Analytics
 * module (views, unique visitors, traffic sources, device/geo, heatmap).
 * Deduped per package per session so client-side remounts don't inflate views.
 */
export function usePackageViewTracking(packageId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!packageId) return;
    const dedupeKey = `ulmind_pv_${packageId}`;
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
      sessionStorage.setItem(dedupeKey, "1");
    } catch { /* private mode — still track */ }

    const params = new URLSearchParams(window.location.search);
    api.post(`/public/packages/${packageId}/track-view`, {
      visitor_id: visitorId(),
      user_id: userId ?? null,
      referrer: document.referrer || null,
      source: params.get("utm_source") ? "campaign" : sourceOf(document.referrer),
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    }).catch(() => { /* analytics must never break the page */ });
  }, [packageId, userId]);
}
