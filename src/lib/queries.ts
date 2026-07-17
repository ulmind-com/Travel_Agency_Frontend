import { queryOptions, infiniteQueryOptions, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import type { AdminUserFilters } from "@/types/admin.users";

import {
  bookingsService,
  packagesService,
  recommendationsService,
  reviewsService,
  travelersService,
  wishlistService,
} from "@/services";
import { authService } from "@/services/auth.service";
import type { PublicPackageFilters } from "@/services/packages.service";
import { heroSlidesService } from "@/services/hero-slides.service";
import { tourCategoriesService } from "@/services/tour-categories.service";
import { popularDestinationsService } from "@/services/popular-destinations.service";
import { planYourTripService } from "@/services/plan-your-trip.service";
import { popularToursService } from "@/services/popular-tours.service";
import { recentGalleryService } from "@/services/recent-gallery.service";
import { achievementsService } from "@/services/achievements.service";
import { adminService } from "@/services/admin.service";
import { qrService, notificationsService, activityService } from "@/services/realtime.service";

/** Don't waste retries on client-side errors (401/403/404). */
const smartRetry = (failureCount: number, error: unknown) => {
  if (axios.isAxiosError(error)) {
    const s = error.response?.status ?? 0;
    if (s >= 400 && s < 500) return false;
  }
  return failureCount < 3;
};

export const authKeys = {
  me: ["auth", "me"] as const,
};

export const authMeQuery = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: () => authService.me(),
    staleTime: 60_000,
    retry: false,
  });

export const packageKeys = {
  all: ["packages"] as const,
  public: (f: PublicPackageFilters) => ["packages", "public", f] as const,
  detail: (id: string) => ["packages", "detail", id] as const,
};

export const publicPackagesQuery = (filters: PublicPackageFilters) =>
  queryOptions({
    queryKey: packageKeys.public(filters),
    queryFn: () => packagesService.publicSearch(filters),
    staleTime: 30_000,
  });

export const packageDetailQuery = (id: string) =>
  queryOptions({
    queryKey: packageKeys.detail(id),
    queryFn: () => packagesService.detail(id),
    staleTime: 60_000,
  });

export const trendingPackagesQuery = (limit = 6) =>
  queryOptions({
    queryKey: ["recommendations", "trending", limit] as const,
    queryFn: () => recommendationsService.trending(limit),
    staleTime: 60_000,
  });

export const personalizedPackagesQuery = (limit = 6) =>
  queryOptions({
    queryKey: ["recommendations", "personalized", limit] as const,
    queryFn: () => recommendationsService.personalized(limit),
    staleTime: 60_000,
  });

export const wishlistQuery = () =>
  queryOptions({
    queryKey: ["wishlist"] as const,
    queryFn: () => wishlistService.list(),
    retry: smartRetry,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 30_000,
  });

export const myBookingsQuery = () =>
  queryOptions({
    queryKey: ["bookings", "mine"] as const,
    queryFn: () => bookingsService.myBookings(),
    retry: smartRetry,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 30_000,
  });

export const packageReviewsQuery = (packageId: string) =>
  queryOptions({
    queryKey: ["reviews", packageId] as const,
    queryFn: () => reviewsService.listForPackage(packageId),
  });

export const travelersQuery = () =>
  queryOptions({
    queryKey: ["travelers"] as const,
    queryFn: () => travelersService.list(),
    retry: smartRetry,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 30_000,
  });

export const heroSlidesQuery = () =>
  queryOptions({
    queryKey: ["hero-slides"] as const,
    queryFn: () => heroSlidesService.list(),
    staleTime: 60_000,
  });

export const tourCategoriesQuery = () =>
  queryOptions({
    queryKey: ["tour-categories"] as const,
    queryFn: () => tourCategoriesService.list(),
    staleTime: 60_000,
  });

export const popularDestinationsQuery = () =>
  queryOptions({
    queryKey: ["popular-destinations"] as const,
    queryFn: () => popularDestinationsService.list(),
    staleTime: 60_000,
  });

export const planYourTripQuery = () =>
  queryOptions({
    queryKey: ["plan-your-trip"] as const,
    queryFn: () => planYourTripService.get(),
    staleTime: 60_000,
  });

export const popularToursQuery = () =>
  queryOptions({
    queryKey: ["popular-tours"] as const,
    queryFn: () => popularToursService.get(),
    staleTime: 60_000,
  });

export const recentGalleryQuery = () =>
  queryOptions({
    queryKey: ["recent-gallery"] as const,
    queryFn: () => recentGalleryService.get(),
    staleTime: 60_000,
  });

export const achievementsQuery = () =>
  queryOptions({
    queryKey: ["achievements"] as const,
    queryFn: () => achievementsService.get(),
    staleTime: 60_000,
  });

export const adminDashboardQuery = (timeframe: string = "last_30_days") =>
  queryOptions({
    queryKey: ["admin", "dashboard", timeframe] as const,
    queryFn: () => adminService.getDashboard(timeframe),
    staleTime: 30_000,
  });

export const adminUsersQuery = (filters: AdminUserFilters) =>
  queryOptions({
    queryKey: ["admin", "users", filters] as const,
    queryFn: () => adminService.listUsers(filters),
    staleTime: 60_000,
  });

export const adminUserProfileQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "users", id, "profile"] as const,
    queryFn: () => adminService.getUserProfile(id),
  });

export const adminUserActivityQuery = (id: string, skip = 0, limit = 50) =>
  queryOptions({
    queryKey: ["admin", "users", id, "activity", skip, limit] as const,
    queryFn: () => adminService.getUserActivity(id, skip, limit),
  });

export const adminUserTimelineQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "users", id, "timeline"] as const,
    queryFn: () => adminService.getUserTimeline(id),
  });

export const adminUserDocumentsQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "users", id, "documents"] as const,
    queryFn: () => adminService.getUserDocuments(id),
  });

export const adminUserSessionsQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "users", id, "sessions"] as const,
    queryFn: () => adminService.getUserSessions(id),
  });

export const adminBookingsQuery = (skip = 0, limit = 50) =>
  queryOptions({
    queryKey: ["admin", "bookings", skip, limit] as const,
    queryFn: () => adminService.listBookings(skip, limit),
    staleTime: 60_000,
  });

// ── Enterprise Payment Center ────────────────────────────────────────────
export const adminPaymentsDashboardQuery = () =>
  queryOptions({
    queryKey: ["admin", "payments", "dashboard"] as const,
    queryFn: () => adminService.getPaymentsDashboard(),
    staleTime: 10_000,
    refetchInterval: 15_000, // live revenue / status without page refresh
    refetchOnWindowFocus: true,
  });

export const adminPaymentsListQuery = (params: Record<string, unknown>) =>
  queryOptions({
    queryKey: ["admin", "payments", "list", params] as const,
    queryFn: () => adminService.listPaymentsAdvanced(params),
    staleTime: 10_000,
    refetchInterval: 15_000,
    placeholderData: (prev: unknown) => prev, // keep page while refetching
  });

export const adminPaymentDetailQuery = (paymentId: string | null) =>
  queryOptions({
    queryKey: ["admin", "payments", paymentId, "detail"] as const,
    queryFn: () => adminService.getPaymentDetail(paymentId as string),
    enabled: !!paymentId,
  });

export const adminPaymentTimelineQuery = (paymentId: string | null) =>
  queryOptions({
    queryKey: ["admin", "payments", paymentId, "timeline"] as const,
    queryFn: () => adminService.getPaymentTimeline(paymentId as string),
    enabled: !!paymentId,
  });

export const adminPaymentWebhooksQuery = (paymentId: string | null) =>
  queryOptions({
    queryKey: ["admin", "payments", paymentId, "webhooks"] as const,
    queryFn: () => adminService.getPaymentWebhooks(paymentId as string),
    enabled: !!paymentId,
  });

export const adminUserBookingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["admin", "users", userId, "bookings"] as const,
    queryFn: () => adminService.getUserBookings(userId),
    staleTime: 10_000,
    // live operations view — booking/payment/refund/QR states refresh without a reload
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

export const adminBookingDetailQuery = (bookingId: string | null) =>
  queryOptions({
    queryKey: ["admin", "bookings", bookingId, "detail"] as const,
    queryFn: () => adminService.getBookingDetail(bookingId as string),
    enabled: !!bookingId,
  });

export const adminBookingTimelineQuery = (bookingId: string | null) =>
  queryOptions({
    queryKey: ["admin", "bookings", bookingId, "timeline"] as const,
    queryFn: () => adminService.getBookingTimeline(bookingId as string),
    enabled: !!bookingId,
  });
// ── Enterprise QR Management ─────────────────────────────────────────────
export const adminQrSummaryQuery = () =>
  queryOptions({
    queryKey: ["admin", "qr", "summary"] as const,
    queryFn: () => qrService.summary(),
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

export const adminQrListQuery = (params: Record<string, unknown>) =>
  queryOptions({
    queryKey: ["admin", "qr", "list", params] as const,
    queryFn: () => qrService.list(params),
    staleTime: 10_000,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  });

export const adminQrDetailQuery = (id: string | null) =>
  queryOptions({
    queryKey: ["admin", "qr", id, "detail"] as const,
    queryFn: () => qrService.detail(id as string),
    enabled: !!id,
  });

export const adminQrHistoryQuery = (id: string | null, page = 1) =>
  queryOptions({
    queryKey: ["admin", "qr", id, "history", page] as const,
    queryFn: () => qrService.history(id as string, page),
    enabled: !!id,
  });

export const adminQrAnalyticsQuery = (id: string | null) =>
  queryOptions({
    queryKey: ["admin", "qr", id, "analytics"] as const,
    queryFn: () => qrService.analytics(id as string),
    enabled: !!id,
  });

// ── Notification Center ──────────────────────────────────────────────────
export const adminNotificationsQuery = (params: Record<string, unknown>) =>
  queryOptions({
    queryKey: ["admin", "notifications", "list", params] as const,
    queryFn: () => notificationsService.list(params),
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });

export const adminUnreadCountQuery = () =>
  queryOptions({
    queryKey: ["admin", "notifications", "unread"] as const,
    queryFn: () => notificationsService.unreadCount(),
    staleTime: 5_000,
    refetchInterval: 30_000, // SSE is primary; this is the safety net
  });

export const adminNotificationPrefsQuery = () =>
  queryOptions({
    queryKey: ["admin", "notifications", "preferences"] as const,
    queryFn: () => notificationsService.getPreferences(),
    staleTime: 60_000,
  });

// ── Live Activity Feed (infinite) ────────────────────────────────────────
export const adminActivityFeedQuery = (filters: Record<string, unknown>) =>
  infiniteQueryOptions({
    queryKey: ["admin", "activity", filters] as const,
    queryFn: ({ pageParam }) => activityService.feed({ ...filters, before: pageParam || undefined, limit: 25 }),
    initialPageParam: "",
    getNextPageParam: (last: { has_more: boolean; next_cursor?: string | null }) =>
      last.has_more ? (last.next_cursor ?? undefined) : undefined,
    staleTime: 5_000,
  });

// ── Enterprise CRM & Customer Intelligence ───────────────────────────────
import { crmService, searchService } from "@/services/crm.service";
import type { CrmListParams } from "@/types/admin.crm";

export const crmSearchQuery = (q: string) =>
  queryOptions({
    queryKey: ["admin", "crm", "search", q] as const,
    queryFn: () => searchService.search(q, 5),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

export const crmSearchHistoryQuery = () =>
  queryOptions({
    queryKey: ["admin", "crm", "search-history"] as const,
    queryFn: () => searchService.history(),
    staleTime: 5_000,
  });

export const crmSuggestionsQuery = (q: string) =>
  queryOptions({
    queryKey: ["admin", "crm", "suggestions", q] as const,
    queryFn: () => searchService.suggestions(q),
    staleTime: 30_000,
  });

export const crmFacetsQuery = () =>
  queryOptions({
    queryKey: ["admin", "crm", "facets"] as const,
    queryFn: () => crmService.facets(),
    staleTime: 300_000,
  });

export const crmHealthQuery = (params: CrmListParams) =>
  queryOptions({
    queryKey: ["admin", "crm", "health", params] as const,
    queryFn: () => crmService.health(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

export const crmLoyaltyQuery = (params: CrmListParams) =>
  queryOptions({
    queryKey: ["admin", "crm", "loyalty", params] as const,
    queryFn: () => crmService.loyalty(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

export const crmFraudQuery = (params: CrmListParams) =>
  queryOptions({
    queryKey: ["admin", "crm", "fraud", params] as const,
    queryFn: () => crmService.fraud(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

export const crmDetailQuery = (userId: string) =>
  queryOptions({
    queryKey: ["admin", "crm", "detail", userId] as const,
    queryFn: () => crmService.loyaltyDetail(userId),   // richest payload (includes ledger)
    staleTime: 15_000,
  });
