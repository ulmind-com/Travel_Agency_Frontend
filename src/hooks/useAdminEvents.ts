import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getToken } from "@/lib/api";
import { notificationsService } from "@/services/realtime.service";
import type {
  AdminEvent, ActivityFeedResponse, ActivityRow, NotificationPreferences,
} from "@/types/admin.realtime";

/**
 * Unified admin realtime stream (`/admin/events/stream`, SSE over the Redis
 * `admin:events` channel). One EventSource per admin session powers:
 *   - the notification bell (unread badge + toast + sound + desktop notification)
 *   - the live activity feed (events are prepended into the query cache
 *     directly — no refetch round-trip)
 *   - QR center / payments / bookings / users query invalidation
 *
 * `EventSource` cannot send an Authorization header, so the JWT travels as a
 * `?token=` query param — verified server-side with the same rules as header auth.
 */

const SOUND_KEY = "ulmind:notify-sound";
const DESKTOP_KEY = "ulmind:notify-desktop";

const PRIORITY_RANK: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

/**
 * In-memory preference cache. Server (`/admin/notifications/preferences`) is
 * the source of truth — hydrated on stream connect and after every PATCH.
 * localStorage only seeds sound/desktop before the first fetch resolves.
 */
let prefs: NotificationPreferences = {
  sound_enabled: true,
  desktop_enabled: false,
  toast_enabled: true,
  muted_categories: [],
  min_toast_priority: "LOW",
  updated_at: "",
};
try {
  prefs.sound_enabled = localStorage.getItem(SOUND_KEY) !== "off";
  prefs.desktop_enabled = localStorage.getItem(DESKTOP_KEY) === "on";
} catch { /* SSR / storage blocked */ }

/** Adopt server preferences into the live cache (+ fast-boot mirror). */
export function applyPreferences(p: NotificationPreferences) {
  prefs = { ...p };
  try {
    localStorage.setItem(SOUND_KEY, p.sound_enabled ? "on" : "off");
    localStorage.setItem(DESKTOP_KEY, p.desktop_enabled ? "on" : "off");
  } catch { /* ignore */ }
}
export function currentPreferences(): NotificationPreferences {
  return prefs;
}

export function soundEnabled(): boolean {
  return prefs.sound_enabled;
}
export function setSoundEnabled(on: boolean) {
  prefs.sound_enabled = on;
  try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch { /* ignore */ }
}
export function desktopEnabled(): boolean {
  return prefs.desktop_enabled;
}
export async function setDesktopEnabled(on: boolean): Promise<boolean> {
  if (!on) {
    prefs.desktop_enabled = false;
    try { localStorage.setItem(DESKTOP_KEY, "off"); } catch { /* ignore */ }
    return false;
  }
  if (typeof Notification === "undefined") return false;
  const perm = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  const granted = perm === "granted";
  prefs.desktop_enabled = granted;
  try { localStorage.setItem(DESKTOP_KEY, granted ? "on" : "off"); } catch { /* ignore */ }
  return granted;
}

/** Should this notification alert (toast/chime/desktop) under current prefs? */
function shouldAlert(category: string, priority: string): boolean {
  if (!prefs.toast_enabled) return false;
  if (prefs.muted_categories.includes(category as NotificationPreferences["muted_categories"][number])) return false;
  return (PRIORITY_RANK[priority] ?? 0) >= (PRIORITY_RANK[prefs.min_toast_priority] ?? 0);
}

/** Subtle two-tone chime rendered with WebAudio — no asset download needed. */
function playChime() {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(880, 0, 0.35);
    play(1174.66, 0.12, 0.4);
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch { /* audio blocked — ignore */ }
}

function showDesktopNotification(title: string, body: string) {
  if (!desktopEnabled() || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico", tag: "ulmind-admin" });
    setTimeout(() => n.close(), 8000);
  } catch { /* ignore */ }
}

const PRIORITY_TOAST: Record<string, "error" | "warning" | "success" | "info"> = {
  CRITICAL: "error",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "info",
};

export function useAdminEvents(enabled: boolean) {
  const queryClient = useQueryClient();
  const retryRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
    let source: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    // Hydrate server-side preferences once per admin session
    notificationsService.getPreferences().then(applyPreferences).catch(() => { /* offline — local cache */ });

    const connect = () => {
      if (closed) return;
      source = new EventSource(`${baseUrl}/admin/events/stream?token=${encodeURIComponent(token)}`);

      source.onopen = () => { retryRef.current = 0; };

      source.onmessage = (msg) => {
        let event: AdminEvent;
        try { event = JSON.parse(msg.data); } catch { return; }

        // 1. Prepend the activity into every cached feed page — instant, no refetch
        if (event.activity) {
          const activity: ActivityRow = { ...event.activity, _id: event.activity.id };
          queryClient.setQueriesData(
            { queryKey: ["admin", "activity"] },
            (old: { pages: ActivityFeedResponse[]; pageParams: unknown[] } | undefined) => {
              if (!old?.pages?.length) return old;
              const [first, ...rest] = old.pages;
              if (first.items.some((i) => i._id === activity._id)) return old;
              return { ...old, pages: [{ ...first, items: [activity, ...first.items] }, ...rest] };
            },
          );
        }

        // 2. Notification → badge + (preference-gated) toast + chime + desktop
        if (event.kind === "notification" && event.notification) {
          const n = event.notification;
          queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
          if (shouldAlert(n.category, n.priority)) {
            const kind = PRIORITY_TOAST[n.priority] ?? "info";
            toast[kind](n.title, { description: n.message, duration: n.priority === "CRITICAL" ? 10_000 : 5_000 });
            playChime();
            showDesktopNotification(n.title, n.message);
          }
        }
        if (event.kind === "notification_state") {
          queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
        }

        // 3. Targeted invalidations by event action → the views refresh live
        const action = event.action ?? "";
        if (event.kind === "qr" || action.startsWith("QR_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "qr"] });
        }
        if (action.startsWith("PAYMENT_") || action.startsWith("REFUND_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
        // Customer Intelligence recomputes from the same real events
        if (event.kind === "crm" || action.startsWith("PAYMENT_") || action.startsWith("BOOKING_") ||
            action.startsWith("REFUND_") || action.startsWith("CUSTOMER_") || action.startsWith("COUPON_") ||
            action.startsWith("QR_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "crm"] });
        }
        if (action.startsWith("BOOKING_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
        if (action.startsWith("CUSTOMER_") || action === "ROLE_UPDATED" || action === "PROFILE_UPDATED") {
          queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }
        // ── Enterprise suite ────────────────────────────────────────────────
        if (event.kind === "support" || action.startsWith("SUPPORT_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
          queryClient.invalidateQueries({ queryKey: ["support"] });
        }
        if (event.kind === "staff" || event.kind === "assignment" ||
            action.startsWith("STAFF_") || action.startsWith("ASSIGNMENT_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
        }
        if (event.kind === "report" || action.startsWith("REPORT_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        }
        if (event.kind === "audit" || action === "AUDIT_RECORDED") {
          queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
        }
        if (action.startsWith("PAYMENT_") || action.startsWith("REFUND_") || action.startsWith("BOOKING_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "revenue"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
        }
        // ── Enterprise Security Center / Marketing / Vault / Map ────────────
        if (event.kind === "security" || action.startsWith("SECURITY_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "security"] });
        }
        if (event.kind === "marketing" || action.startsWith("CAMPAIGN_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] });
        }
        if (event.kind === "documents" || action.startsWith("DOCUMENT_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "vault"] });
          queryClient.invalidateQueries({ queryKey: ["my", "vault"] });
        }
        if (event.kind === "map" || action.startsWith("MAP_")) {
          queryClient.invalidateQueries({ queryKey: ["admin", "map"] });
        }
      };

      source.onerror = () => {
        source?.close();
        if (closed) return;
        // exponential backoff reconnect: 1s → 2s → 4s … capped at 30s
        const delay = Math.min(30_000, 1000 * 2 ** retryRef.current);
        retryRef.current += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      source?.close();
    };
  }, [enabled, queryClient]);
}
