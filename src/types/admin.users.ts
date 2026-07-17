import { UserResponse, CloudinaryMedia } from "./api";

export type AdminUserListResponse = {
  total: number;
  users: AdminUser[];
};

export type AdminUser = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
  phone_number?: string | null;
  customer_id?: string | null;
  
  gender?: string | null;
  dob?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  last_login_location?: string | null;
  current_login_location?: string | null;
  
  preferred_language?: string | null;
  preferred_currency?: string | null;
  two_factor_enabled?: boolean;
  password_last_changed?: string | null;
  
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_page?: string | null;
  registration_source?: string | null;
  
  is_blocked: boolean;
  is_suspended: boolean;
  suspension_reason?: string | null;
  deleted_at?: string | null;
  
  kyc?: {
    verification_status: "PENDING" | "VERIFIED" | "REJECTED";
    verification_date?: string | null;
    passport?: CloudinaryMedia | null;
    government_id?: CloudinaryMedia | null;
    pan?: CloudinaryMedia | null;
    aadhar?: CloudinaryMedia | null;
    driving_license?: CloudinaryMedia | null;
    insurance?: CloudinaryMedia | null;
    visa?: CloudinaryMedia | null;
    travel_documents?: CloudinaryMedia[];
  };
  
  booking_count: number;
  completed_trips?: number;
  upcoming_trips?: number;
  cancelled_trips?: number;
  cancellation_count?: number;
  coupons_used?: number;
  reward_points?: number;
  reviews_count?: number;
  lifetime_spending: number;
  average_booking_value?: number;
  
  last_login?: string | null;
  last_activity?: string | null;
  last_ip?: string | null;
  last_device?: string | null;
  last_browser?: string | null;
  
  created_at: string;
  profile_image?: CloudinaryMedia | null;
  
  is_online?: boolean;
  current_session?: any;
};

export type AdminUserProfileResponse = {
  user: AdminUser;
  recent_bookings: any[];
  recent_payments: any[];
};

export type AdminUserFilters = {
  search?: string;
  role?: string;
  status?: string; // ACTIVE, SUSPENDED, BLOCKED, DELETED
  skip?: number;
  limit?: number;
};
