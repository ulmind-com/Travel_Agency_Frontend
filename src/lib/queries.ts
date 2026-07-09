import { queryOptions } from "@tanstack/react-query";

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
  });

export const myBookingsQuery = () =>
  queryOptions({
    queryKey: ["bookings", "mine"] as const,
    queryFn: () => bookingsService.myBookings(),
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