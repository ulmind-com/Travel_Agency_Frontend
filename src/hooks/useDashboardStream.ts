import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/api";

/**
 * Live invalidation streams (SSE). `EventSource` cannot send an Authorization
 * header, so the JWT travels as a `?token=` query param — the backend verifies
 * it with the same rules as header auth (admin-only).
 */
function useSseInvalidation(path: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
    const eventSource = new EventSource(`${baseUrl}${path}?token=${encodeURIComponent(token)}`);

    eventSource.onmessage = () => {
      // Any published event means server-side state changed — background refetch.
      queryClient.invalidateQueries({ queryKey: [...queryKey] });
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, path, JSON.stringify(queryKey)]);
}

/** Admin overview dashboard — refreshes on `dashboard:updates` events. */
export function useDashboardStream() {
  useSseInvalidation("/admin/dashboard/stream", ["admin", "dashboard"]);
}

/** Payment Center — refreshes KPIs, ledger and open drawers on `payments:updates` events. */
export function usePaymentsStream() {
  useSseInvalidation("/admin/payments/stream", ["admin", "payments"]);
}
