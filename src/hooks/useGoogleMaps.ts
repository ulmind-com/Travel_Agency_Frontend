import { useEffect, useState } from "react";

/**
 * Loads the Google Maps JS API (with the `visualization` library for the
 * heatmap layer) exactly once. The key comes from `VITE_GOOGLE_MAPS_API_KEY`.
 * When no key is configured the hook resolves to `status: "unavailable"` so the
 * Operations Map can degrade gracefully to its data panels instead of crashing.
 */
type Status = "loading" | "ready" | "unavailable" | "error";

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useGoogleMaps(): { status: Status; gmaps: any | null } {
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window !== "undefined" && window.google?.maps) return "ready";
    if (!KEY) return "unavailable";
    return "loading";
  });

  useEffect(() => {
    if (status === "ready" || status === "unavailable") return;
    if (window.google?.maps) { setStatus("ready"); return; }

    if (!window.__gmapsPromise) {
      window.__gmapsPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=visualization,marker&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google Maps failed to load"));
        document.head.appendChild(script);
      });
    }
    let alive = true;
    window.__gmapsPromise
      .then(() => { if (alive) setStatus("ready"); })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [status]);

  return { status, gmaps: status === "ready" && window.google ? window.google : null };
}
