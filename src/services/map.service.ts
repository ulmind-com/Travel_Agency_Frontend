/**
 * Real-Time Operations Map — API layer.
 * Aggregate surfaces: ADMIN+. Live positions / pings / geofences / replay: SUPER_ADMIN.
 */
import { api } from "@/lib/api";
import type {
  GeoBreakdown, GeofenceRow, HeatPoint, LivePosition, MapOverview, TripRow,
} from "@/types/admin.map";

export const mapService = {
  overview: async (): Promise<MapOverview> =>
    (await api.get("/admin/map/overview")).data,

  trips: async (status?: string): Promise<{ items: TripRow[] }> =>
    (await api.get("/admin/map/trips", { params: { status } })).data,

  heatmap: async (): Promise<{ points: HeatPoint[]; top_destinations: HeatPoint[] }> =>
    (await api.get("/admin/map/heatmap")).data,

  geoBreakdown: async (dimension: "country" | "state" | "city"): Promise<GeoBreakdown> =>
    (await api.get("/admin/map/geo-breakdown", { params: { dimension } })).data,

  live: async (): Promise<{ items: LivePosition[] }> =>
    (await api.get("/admin/map/live")).data,

  ping: async (body: {
    staff_id: string; latitude: number; longitude: number;
    speed_kmh?: number; heading?: number; accuracy_m?: number; booking_id?: string;
  }) => (await api.post("/admin/map/location/ping", body)).data,

  replay: async (staffId: string, limit = 500): Promise<{
    staff: { id: string; name: string; type: string }; points: LivePosition[]; distance_km: number;
  }> => (await api.get(`/admin/map/replay/${staffId}`, { params: { limit } })).data,

  eta: async (staffId: string, bookingId: string) =>
    (await api.get("/admin/map/eta", { params: { staff_id: staffId, booking_id: bookingId } })).data,

  geofences: async (): Promise<{ items: GeofenceRow[] }> =>
    (await api.get("/admin/map/geofences")).data,

  createGeofence: async (body: {
    name: string; type?: string; place?: string;
    latitude?: number; longitude?: number; radius_m: number; booking_id?: string;
  }) => (await api.post("/admin/map/geofences", body)).data,

  deleteGeofence: async (id: string) =>
    (await api.delete(`/admin/map/geofences/${id}`)).data,
};
