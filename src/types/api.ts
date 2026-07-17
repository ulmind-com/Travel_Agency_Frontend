// Shared API types generated from the Ulmind Travel backend OpenAPI spec.
// Kept as hand-written TypeScript types (with a light runtime shape) rather
// than a full codegen because we only touch ~30 endpoints.

export type CloudinaryMedia = {
  url: string;
  public_id: string;
};

export type PackageCategory =
  | "HONEYMOON"
  | "ADVENTURE"
  | "BEACH"
  | "WILDLIFE"
  | "HERITAGE"
  | "FAMILY"
  | "MOUNTAIN"
  | "PILGRIMAGE"
  | "OTHER";

export type VideoType = "YOUTUBE" | "UPLOADED" | "NONE";

export type ItineraryDay = {
  day_number: number;
  title: string;
  timing_details: string;
  plan_description: string;
  day_image?: CloudinaryMedia | null;
};

export type TransportInfo = {
  vehicle_type: string;
  total_vehicles: number;
  seats_per_vehicle: number;
  total_seats?: number;
};

export type Package = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  destinations: string[];
  category: PackageCategory;
  duration_days: number;
  duration_nights: number;
  valid_from?: string | null;
  valid_upto?: string | null;
  base_price: number;
  discounted_price?: number | null;
  currency: string;
  tax_percent?: number;
  transport_info?: TransportInfo | null;
  gallery_images: CloudinaryMedia[];
  itinerary: ItineraryDay[];
  required_traveler_documents: string[];
  inclusions: string[];
  exclusions: string[];
  thumbnail: CloudinaryMedia;
  video_type?: VideoType;
  video_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  average_rating?: number;
  total_reviews?: number;
  seats_available?: number;
  cancellation_policy?: string;
};

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone_number?: string | null;
  profile_image?: CloudinaryMedia | null;
  customer_id?: string | null;
  gender?: string | null;
  dob?: string | null;
  country?: string | null;
  city?: string | null;
  created_at?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string | null;
  /** 2FA challenge flow — access_token is empty until the second factor clears */
  requires_2fa?: boolean;
  pre_auth_token?: string | null;
  methods?: ("TOTP" | "EMAIL_OTP" | "RECOVERY_CODE")[];
};

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type SavedTraveler = {
  _id?: string;
  id?: string;
  name: string;
  gender: Gender;
  age: number;
  relation?: string | null;
};

export type TravelerType = "ADULT" | "CHILD" | "INFANT";

export type Traveler = {
  traveler_type: TravelerType;
  name: string;
  phone?: string | null;
  email?: string | null;
  photo?: CloudinaryMedia;
  uploaded_documents?: Record<string, CloudinaryMedia>;
};

export type BookingStatus =
  | "PENDING"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "CANCELLATION_REQUESTED"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export type InvoiceStatus = "PENDING" | "GENERATED" | "SENT";
export type TicketStatus = "PENDING" | "ISSUED" | "SCANNED";

export type PackageSnapshot = {
  title?: string | null;
  slug?: string | null;
  destination?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  duration_days?: number | null;
  duration_nights?: number | null;
  thumbnail?: CloudinaryMedia | null;
};

export type Booking = {
  _id?: string;
  id?: string;
  booking_reference: string;
  user_id: string;
  package_id: string;
  package_snapshot?: PackageSnapshot;
  travel_start_date: string;
  travelers_count: number;
  adults?: number;
  children?: number;
  infants?: number;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  status: BookingStatus;
  invoice_status?: InvoiceStatus;
  ticket_status?: TicketStatus;
  travelers: Traveler[];
  qr_code_url?: string | null;
  qr_code_public_id?: string | null;
  qr_verification_token?: string | null;
  is_checked_in?: boolean;
  check_in_time?: string | null;
  tour_end_date?: string | null;
  cancellation_requested_at?: string | null;
  cancelled_at?: string | null;
  refund_amount?: number;
  penalty_amount?: number;
  applied_promo_code?: string | null;
  created_at?: string;
  // Extra package data populated from API
  package_title?: string;
  package_thumbnail?: CloudinaryMedia | null;
  package_destinations?: string[];
  user_name?: string;
  user_email?: string;
};

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export type Payment = {
  _id?: string;
  id?: string;
  payment_reference: string;
  booking_id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  gst_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  mode?: string;
  status: PaymentStatus;
  is_partial_payment?: boolean;
  remaining_balance?: number;
  created_at?: string;
};

export type ActivityLog = {
  id?: string;
  user_id?: string;
  action: string;
  description: string;
  ip_address?: string;
  device?: string;
  created_at?: string;
};

export type Review = {
  _id?: string;
  id?: string;
  user_id?: string;
  user_name?: string;
  package_id: string;
  rating: number;
  comment: string;
  created_at?: string;
};

export type TopPackageInfo = {
  package_id: string;
  title: string;
  thumbnail_url?: string | null;
  total_sales: number;
  booking_count: number;
};

export type TopPromoCodeInfo = {
  code: string;
  discount_type: string;
  current_uses: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type CategoryDataPoint = {
  name: string;
  value: number;
};

export type EnterpriseDashboardResponse = {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  todayRegistrations: number;
  todayBookings: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundRequests: number;
  todayRevenue: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  averageBookingValue: number;
  conversionRate: number;
  activePackages: number;
  cancelledTrips: number;
  generatedAt: string;
  
  revenueChart: ChartDataPoint[];
  bookingsChart: ChartDataPoint[];
  paymentMethodsChart: CategoryDataPoint[];
  bookingStatusChart: CategoryDataPoint[];
  userGrowthChart: ChartDataPoint[];
  
  topPackages: TopPackageInfo[];
};

export type AdminUserProfileResponse = {
  user: UserResponse;
  bookings_history: Booking[];
  payment_history: Payment[];
  activity_timeline: ActivityLog[];
};

/** Utility to normalize the Mongo `_id` field into a stable `id` on any doc. */
export function withId<T extends { _id?: string; id?: string }>(doc: T): T & { id: string } {
  const id = doc.id ?? doc._id ?? "";
  return { ...doc, id };
}