import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Unified map-engine loader for the Real-Time Operations Map.
 *
 * Primary engine is Google Maps (JS API, `visualization` + `marker` libraries).
 * One or more comma-separated keys come from `VITE_GOOGLE_MAPS_API_KEY`; they
 * are tried in order and the first working one wins. If **every** Google key
 * fails for any reason — missing, invalid, unauthorized, over-quota, billing
 * disabled, referrer-blocked, network error, offline, or a late runtime
 * `gm_authFailure` — the loader falls back **immediately and automatically** to
 * OpenStreetMap via Leaflet (loaded from CDN, no key required). So the live
 * interactive map always renders.
 *
 * The user can also force an engine via `setPreferred("google" | "osm")`;
 * "auto" (default) prefers Google and falls back to OSM.
 */

export type MapEngine = "google" | "osm";
export type EnginePref = "auto" | MapEngine;
export type OpsMapStatus = "loading" | "ready" | "error";

const RAW_KEYS = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";
const GOOGLE_KEYS = RAW_KEYS.split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_HEAT = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";

/** How long we wait after a Google script loads for a `gm_authFailure` before
 *  treating the key as good. Auth/billing failures fire within a few hundred ms. */
const AUTH_GRACE_MS = 1500;
const LOAD_TIMEOUT_MS = 12_000;

function injectScript(src: string, id?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    if (id) el.id = id;
    el.src = src;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

function removeGoogleArtifacts() {
  document.querySelectorAll('script[data-ops-gmaps="1"]').forEach((s) => s.remove());
  try {
    delete (window as any).google;
  } catch {
    (window as any).google = undefined;
  }
}

/** Try a single Google Maps key. Resolves when the API is usable, rejects on
 *  any load or auth failure. */
function tryGoogleKey(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let authFailed = false;

    // Google calls this global (no args) on invalid key / billing / referrer.
    window.gm_authFailure = () => {
      authFailed = true;
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("gm_authFailure"));
      } else {
        // Late failure after we already reported ready → bridge to the hook.
        window.__opsMapOnGoogleAuthFail?.();
      }
    };

    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("google load timeout"));
      }
    }, LOAD_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeout);
    }

    const script = document.createElement("script");
    script.dataset.opsGmaps = "1";
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&libraries=visualization,marker&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Give gm_authFailure a moment; if it doesn't fire, the key is good.
      window.setTimeout(() => {
        if (settled) return;
        if (authFailed || !window.google?.maps) {
          settled = true;
          cleanup();
          reject(new Error("google unavailable after load"));
          return;
        }
        settled = true;
        cleanup();
        resolve();
      }, AUTH_GRACE_MS);
    };
    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("google script error"));
    };
    document.head.appendChild(script);
  });
}

async function loadGoogle(): Promise<void> {
  if (window.google?.maps) return;
  if (!GOOGLE_KEYS.length) throw new Error("no google keys configured");
  let lastErr: unknown;
  for (let i = 0; i < GOOGLE_KEYS.length; i++) {
    try {
      if (i > 0) removeGoogleArtifacts(); // clean the failed attempt before retry
      await tryGoogleKey(GOOGLE_KEYS[i]);
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("all google keys failed");
}

function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletPromise) return window.__leafletPromise;

  window.__leafletPromise = (async () => {
    if (!document.querySelector('link[data-ops-leaflet="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.dataset.opsLeaflet = "1";
      document.head.appendChild(link);
    }
    await injectScript(LEAFLET_JS, "ops-leaflet-js");
    // Heat plugin is optional; ignore failure and degrade to weighted markers.
    try {
      await injectScript(LEAFLET_HEAT, "ops-leaflet-heat");
    } catch {
      /* heat plugin unavailable — canvas handles the missing plugin */
    }
    return window.L;
  })();

  return window.__leafletPromise;
}

export interface UseOpsMap {
  status: OpsMapStatus;
  provider: MapEngine | null;
  gmaps: any | null;
  L: any | null;
  preferred: EnginePref;
  setPreferred: (e: EnginePref) => void;
  /** True once Google has been tried and failed (or no keys), so the UI can
   *  explain why OSM is active. */
  googleFailed: boolean;
  keysConfigured: number;
}

export function useOpsMap(): UseOpsMap {
  const [preferred, setPreferred] = useState<EnginePref>("auto");
  const [status, setStatus] = useState<OpsMapStatus>("loading");
  const [provider, setProvider] = useState<MapEngine | null>(null);
  const [googleFailed, setGoogleFailed] = useState(false);
  const runIdRef = useRef(0);

  const fallbackToOsm = useCallback(async (runId: number) => {
    try {
      const L = await loadLeaflet();
      if (runId !== runIdRef.current) return;
      if (L) {
        setProvider("osm");
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      if (runId !== runIdRef.current) return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const runId = ++runIdRef.current;
    setStatus("loading");
    setProvider(null);

    // Late Google auth failure → switch live to OSM without a refresh.
    window.__opsMapOnGoogleAuthFail = () => {
      if (runId !== runIdRef.current) return;
      setGoogleFailed(true);
      void fallbackToOsm(runId);
    };

    (async () => {
      // Forced OSM
      if (preferred === "osm") {
        await fallbackToOsm(runId);
        return;
      }

      // Google (auto or forced-google) — fall back to OSM unless forced-google.
      try {
        await loadGoogle();
        if (runId !== runIdRef.current) return;
        setProvider("google");
        setStatus("ready");
      } catch {
        if (runId !== runIdRef.current) return;
        setGoogleFailed(true);
        if (preferred === "google") {
          setStatus("error");
        } else {
          await fallbackToOsm(runId);
        }
      }
    })();

    return () => {
      if (window.__opsMapOnGoogleAuthFail && runId === runIdRef.current) {
        window.__opsMapOnGoogleAuthFail = null;
      }
    };
  }, [preferred, fallbackToOsm]);

  return {
    status,
    provider,
    gmaps: provider === "google" && window.google ? window.google : null,
    L: provider === "osm" && window.L ? window.L : null,
    preferred,
    setPreferred,
    googleFailed,
    keysConfigured: GOOGLE_KEYS.length,
  };
}
