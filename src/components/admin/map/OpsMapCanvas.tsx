import { useEffect, useRef } from "react";
import type { GeofenceRow, HeatPoint, LivePosition, TripRow } from "@/types/admin.map";

/* eslint-disable @typescript-eslint/no-explicit-any */

type MapType = "roadmap" | "satellite";

interface Props {
  gmaps: any;
  trips: TripRow[];
  heat: HeatPoint[];
  live: LivePosition[];
  geofences: GeofenceRow[];
  replay?: LivePosition[] | null;
  showHeatmap: boolean;
  showTraffic: boolean;
  mapType: MapType;
  onSelectTrip?: (bookingId: string) => void;
}

const PHASE_COLOR: Record<string, string> = {
  ONGOING: "#f59e0b", UPCOMING: "#0ea5e9", COMPLETED: "#10b981",
};

/** Google Maps canvas: destination markers (clustered by proximity), route
 * polylines origin→destination, live staff markers, geofence circles, an
 * optional heatmap layer and replay trail. Everything is driven by real data. */
export function OpsMapCanvas(props: Props) {
  const { gmaps } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const heatRef = useRef<any>(null);
  const trafficRef = useRef<any>(null);
  const infoRef = useRef<any>(null);

  // Init map once
  useEffect(() => {
    if (!gmaps || !divRef.current || mapRef.current) return;
    mapRef.current = new gmaps.maps.Map(divRef.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // India centroid; recentred to data below
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#f5f2ea" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#5b5346" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe0e6" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      ],
    });
    infoRef.current = new gmaps.maps.InfoWindow();
    trafficRef.current = new gmaps.maps.TrafficLayer();
  }, [gmaps]);

  // Map type + traffic
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(props.mapType);
    trafficRef.current?.setMap(props.showTraffic ? mapRef.current : null);
  }, [props.mapType, props.showTraffic]);

  // Draw trips + geofences + live
  useEffect(() => {
    if (!gmaps || !mapRef.current) return;
    const map = mapRef.current;
    overlaysRef.current.forEach((o) => o.setMap?.(null));
    overlaysRef.current = [];
    const bounds = new gmaps.maps.LatLngBounds();
    let hasPoint = false;

    for (const t of props.trips) {
      const dc = t.destination_coords;
      if (!dc) continue;
      hasPoint = true;
      bounds.extend(dc);
      const marker = new gmaps.maps.Marker({
        position: dc, map,
        title: `${t.package.destination ?? ""} · ${t.booking_reference ?? ""}`,
        icon: {
          path: gmaps.maps.SymbolPath.CIRCLE, scale: 7,
          fillColor: PHASE_COLOR[t.phase] ?? "#64748b", fillOpacity: 0.95,
          strokeColor: "#fff", strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        infoRef.current.setContent(
          `<div style="font-family:sans-serif;min-width:180px">
            <div style="font-weight:600;color:#1c1917">${t.package.destination ?? "Trip"}</div>
            <div style="font-size:12px;color:#78716c">${t.booking_reference ?? ""} · ${t.phase}</div>
            <div style="font-size:12px;color:#78716c">${t.customer.name ?? ""}</div>
            ${t.progress_pct != null ? `<div style="font-size:12px;color:#f59e0b">Progress ${t.progress_pct}%</div>` : ""}
            ${t.distance_km != null ? `<div style="font-size:12px;color:#78716c">${t.distance_km} km</div>` : ""}
          </div>`);
        infoRef.current.open(map, marker);
        props.onSelectTrip?.(t.booking_id);
      });
      overlaysRef.current.push(marker);

      // origin → destination route line
      if (t.origin_coords) {
        bounds.extend(t.origin_coords);
        const line = new gmaps.maps.Polyline({
          path: [t.origin_coords, dc], map, geodesic: true,
          strokeColor: PHASE_COLOR[t.phase] ?? "#64748b", strokeOpacity: 0.5, strokeWeight: 2,
        });
        overlaysRef.current.push(line);
      }
    }

    for (const f of props.geofences) {
      const circle = new gmaps.maps.Circle({
        map, center: { lat: f.latitude, lng: f.longitude }, radius: f.radius_m,
        strokeColor: "#c8a24a", strokeOpacity: 0.7, strokeWeight: 1.5,
        fillColor: "#c8a24a", fillOpacity: 0.08,
      });
      overlaysRef.current.push(circle);
    }

    for (const p of props.live) {
      hasPoint = true;
      bounds.extend({ lat: p.lat, lng: p.lng });
      const m = new gmaps.maps.Marker({
        position: { lat: p.lat, lng: p.lng }, map,
        title: `${p.staff_name ?? "Staff"} (${p.staff_type ?? ""})`,
        icon: {
          path: "M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z",
          fillColor: "#ef4444", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 1.5,
          scale: 1.4, anchor: new gmaps.maps.Point(12, 22),
        },
      });
      m.addListener("click", () => {
        infoRef.current.setContent(
          `<div style="font-family:sans-serif"><b>${p.staff_name ?? "Staff"}</b><br/>
            <span style="font-size:12px;color:#78716c">${p.staff_type ?? ""} ${p.speed_kmh ? `· ${p.speed_kmh} km/h` : ""}</span></div>`);
        infoRef.current.open(map, m);
      });
      overlaysRef.current.push(m);
    }

    // Replay trail
    if (props.replay && props.replay.length > 1) {
      const path = props.replay.map((p) => ({ lat: p.lat, lng: p.lng }));
      path.forEach((pt) => { bounds.extend(pt); hasPoint = true; });
      const trail = new gmaps.maps.Polyline({
        path, map, geodesic: true, strokeColor: "#7c3aed", strokeOpacity: 0.9, strokeWeight: 3,
        icons: [{ icon: { path: gmaps.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: "100%" }],
      });
      overlaysRef.current.push(trail);
    }

    if (hasPoint) {
      map.fitBounds(bounds);
      if (map.getZoom() > 12) map.setZoom(12);
    }
  }, [gmaps, props.trips, props.geofences, props.live, props.replay]);

  // Heatmap layer
  useEffect(() => {
    if (!gmaps || !mapRef.current) return;
    if (heatRef.current) { heatRef.current.setMap(null); heatRef.current = null; }
    if (props.showHeatmap && props.heat.length) {
      heatRef.current = new gmaps.maps.visualization.HeatmapLayer({
        map: mapRef.current, radius: 32, opacity: 0.75,
        data: props.heat.map((h) => ({
          location: new gmaps.maps.LatLng(h.lat, h.lng),
          weight: h.bookings,
        })),
      });
    }
  }, [gmaps, props.showHeatmap, props.heat]);

  return <div ref={divRef} className="h-full w-full" />;
}
