import { useEffect, useRef } from "react";
import type { GeofenceRow, HeatPoint, LivePosition, TripRow } from "@/types/admin.map";

/* eslint-disable @typescript-eslint/no-explicit-any */

type MapType = "roadmap" | "satellite";

interface Props {
  L: any;
  trips: TripRow[];
  heat: HeatPoint[];
  live: LivePosition[];
  geofences: GeofenceRow[];
  replay?: LivePosition[] | null;
  showHeatmap: boolean;
  mapType: MapType;
  onSelectTrip?: (bookingId: string) => void;
}

const PHASE_COLOR: Record<string, string> = {
  ONGOING: "#f59e0b",
  UPCOMING: "#0ea5e9",
  COMPLETED: "#10b981",
};

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SAT_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTR = "Tiles &copy; Esri";

/** OpenStreetMap / Leaflet canvas — the automatic fallback engine when Google
 * Maps is unavailable. Mirrors OpsMapCanvas: destination markers, origin→dest
 * routes, live staff pins, geofence circles, an optional heat layer and a
 * replay trail, all driven by the same real booking data. Needs no API key. */
export function OsmMapCanvas(props: Props) {
  const { L } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const baseRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const heatRef = useRef<any>(null);

  // Init map once
  useEffect(() => {
    if (!L || !divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, {
      center: [20.5937, 78.9629], // India centroid; recentred to data below
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    overlayRef.current = L.layerGroup().addTo(map);
    baseRef.current = L.tileLayer(OSM_TILES, { attribution: OSM_ATTR, maxZoom: 19 }).addTo(map);
    // Leaflet needs a size recalc once its container has real dimensions.
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [L]);

  // Base layer (roadmap ↔ satellite)
  useEffect(() => {
    if (!L || !mapRef.current) return;
    if (baseRef.current) baseRef.current.remove();
    baseRef.current =
      props.mapType === "satellite"
        ? L.tileLayer(SAT_TILES, { attribution: SAT_ATTR, maxZoom: 19 })
        : L.tileLayer(OSM_TILES, { attribution: OSM_ATTR, maxZoom: 19 });
    baseRef.current.addTo(mapRef.current);
    baseRef.current.bringToBack?.();
  }, [L, props.mapType]);

  // Draw trips + geofences + live + replay
  useEffect(() => {
    if (!L || !mapRef.current || !overlayRef.current) return;
    const map = mapRef.current;
    const group = overlayRef.current;
    group.clearLayers();
    const pts: [number, number][] = [];

    for (const t of props.trips) {
      const dc = t.destination_coords;
      if (!dc) continue;
      pts.push([dc.lat, dc.lng]);
      const color = PHASE_COLOR[t.phase] ?? "#64748b";
      const marker = L.circleMarker([dc.lat, dc.lng], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
      }).addTo(group);
      marker.bindPopup(
        `<div style="font-family:sans-serif;min-width:180px">
          <div style="font-weight:600;color:#1c1917">${esc(t.package.destination ?? "Trip")}</div>
          <div style="font-size:12px;color:#78716c">${esc(t.booking_reference ?? "")} · ${t.phase}</div>
          <div style="font-size:12px;color:#78716c">${esc(t.customer.name ?? "")}</div>
          ${t.progress_pct != null ? `<div style="font-size:12px;color:#f59e0b">Progress ${t.progress_pct}%</div>` : ""}
          ${t.distance_km != null ? `<div style="font-size:12px;color:#78716c">${t.distance_km} km</div>` : ""}
        </div>`,
      );
      marker.on("click", () => props.onSelectTrip?.(t.booking_id));

      if (t.origin_coords) {
        pts.push([t.origin_coords.lat, t.origin_coords.lng]);
        L.polyline(
          [
            [t.origin_coords.lat, t.origin_coords.lng],
            [dc.lat, dc.lng],
          ],
          { color, weight: 2, opacity: 0.5 },
        ).addTo(group);
      }
    }

    for (const f of props.geofences) {
      L.circle([f.latitude, f.longitude], {
        radius: f.radius_m,
        color: "#c8a24a",
        weight: 1.5,
        opacity: 0.7,
        fillColor: "#c8a24a",
        fillOpacity: 0.08,
      }).addTo(group);
    }

    for (const p of props.live) {
      pts.push([p.lat, p.lng]);
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 8,
        color: "#fff",
        weight: 2,
        fillColor: "#ef4444",
        fillOpacity: 1,
      }).addTo(group);
      m.bindPopup(
        `<div style="font-family:sans-serif"><b>${esc(p.staff_name ?? "Staff")}</b><br/>
          <span style="font-size:12px;color:#78716c">${esc(p.staff_type ?? "")} ${p.speed_kmh ? `· ${p.speed_kmh} km/h` : ""}</span></div>`,
      );
    }

    if (props.replay && props.replay.length > 1) {
      const path = props.replay.map((p) => [p.lat, p.lng] as [number, number]);
      path.forEach((pt) => pts.push(pt));
      L.polyline(path, { color: "#7c3aed", weight: 3, opacity: 0.9 }).addTo(group);
    }

    if (pts.length) {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [L, props.trips, props.geofences, props.live, props.replay]);

  // Heat layer
  useEffect(() => {
    if (!L || !mapRef.current) return;
    if (heatRef.current) {
      heatRef.current.remove();
      heatRef.current = null;
    }
    if (!props.showHeatmap || !props.heat.length) return;

    if (typeof L.heatLayer === "function") {
      const max = Math.max(...props.heat.map((h) => h.bookings), 1);
      heatRef.current = L.heatLayer(
        props.heat.map((h) => [h.lat, h.lng, h.bookings / max]),
        { radius: 32, blur: 20, maxZoom: 12 },
      ).addTo(mapRef.current);
    } else {
      // Plugin unavailable → weighted translucent circles approximate the heat.
      const max = Math.max(...props.heat.map((h) => h.bookings), 1);
      const layer = L.layerGroup();
      for (const h of props.heat) {
        L.circle([h.lat, h.lng], {
          radius: 30000 + (h.bookings / max) * 90000,
          stroke: false,
          fillColor: "#ef4444",
          fillOpacity: 0.15 + (h.bookings / max) * 0.35,
        }).addTo(layer);
      }
      layer.addTo(mapRef.current);
      heatRef.current = layer;
    }
  }, [L, props.showHeatmap, props.heat]);

  return <div ref={divRef} className="h-full w-full" />;
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
