export interface BookingSummary {
  total_bookings: number;
  upcoming_trips: number;
  on_trip: number;
  completed_trips: number;
  cancelled_trips: number;
  pending_trips: number;
  pending_payments: number;
  successful_payments: number;
  refund_requests: number;
  lifetime_booking_value: number;
  average_booking_value: number;
  last_booking_date: string | null;
  next_travel_date: string | null;
}

export interface BookingRow {
  id: string;
  booking_reference: string;
  package_title?: string | null;
  package_thumbnail?: string | null;
  destination?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  travel_start_date?: string | null;
  tour_end_date?: string | null;
  created_at?: string | null;
  travelers_count?: number;
  duration_days?: number | null;
  duration_nights?: number | null;
  total_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  net_amount?: number;
  status: string;
  payment_status: string;
  payment_mode?: string | null;
  payment_reference?: string | null;
  razorpay_payment_id?: string | null;
  invoice_status?: string;
  invoice_number?: string | null;
  qr_status: string;
  qr_scan_count?: number;
  refund_status: string;
  travel_status: string;
  tour_manager?: string | null;
  guide_assigned?: string | null;
  paid_at?: string | null;
  traveler_names?: string[];
  qr_verification_token?: string | null;
}

export interface UserBookingsResponse {
  summary: BookingSummary;
  bookings: BookingRow[];
  count: number;
}

export interface TimelineEvent {
  label: string;
  at: string | null;
  icon: string;
  meta?: string | null;
  actor?: string | null;
  ip?: string | null;
}
