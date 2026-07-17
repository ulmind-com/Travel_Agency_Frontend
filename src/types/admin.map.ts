// ── Real-Time Operations Map types ───────────────────────────────────────────

export interface LatLng { lat: number; lng: number; display_name?: string; city?: string | null }

export interface TripStaff {
  assignment_id: string;
  staff_id: string;
  name?: string | null;
  role?: string | null;
  phone?: string | null;
}

export interface TripRow {
  booking_id: string;
  booking_reference?: string | null;
  status: string;
  phase: "UPCOMING" | "ONGOING" | "COMPLETED";
  customer: { id: string; name?: string | null; email?: string | null; country?: string | null; city?: string | null };
  package: { title?: string | null; destination?: string | null; country?: string | null; state?: string | null; city?: string | null };
  destination_coords?: LatLng | null;
  origin_coords?: LatLng | null;
  pickup: { name?: string | null; coords?: LatLng | null };
  drop: { name?: string | null; coords?: LatLng | null };
  hotel: { name?: string | null; coords?: LatLng | null };
  travel_start_date?: string | null;
  tour_end_date?: string | null;
  travelers_count: number;
  net_amount: number;
  progress_pct?: number | null;
  distance_km?: number | null;
  is_checked_in: boolean;
  staff: TripStaff[];
}

export interface MapOverview {
  trips: { UPCOMING: number; ONGOING: number; COMPLETED: number };
  total_trips: number;
  live_staff: number;
  geofences: number;
  user_presence: { country: string; city?: string | null; count: number; lat?: number; lng?: number }[];
  generated_at: string;
}

export interface HeatPoint {
  destination: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  lat: number;
  lng: number;
  bookings: number;
  revenue: number;
  travelers: number;
}

export interface LivePosition {
  staff_id: string;
  staff_name?: string | null;
  staff_type?: string | null;
  staff_code?: string | null;
  live_status?: string | null;
  phone?: string | null;
  lat: number;
  lng: number;
  speed_kmh?: number | null;
  heading?: number | null;
  accuracy_m?: number | null;
  booking_id?: string | null;
  recorded_at: string;
}

export interface GeofenceRow {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  booking_id?: string | null;
  is_active: boolean;
  created_by_name?: string | null;
  created_at: string;
}

export interface GeoBreakdown {
  dimension: string;
  items: { name: string; bookings: number; revenue: number; travelers: number }[];
}
