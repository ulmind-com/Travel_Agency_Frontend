import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "./env";

const TOKEN_KEY = "ulmind_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* no-op */
  }
  // Notify subscribers (AuthProvider) so the UI can react.
  window.dispatchEvent(new CustomEvent("ulmind:auth-changed"));
}

export const api = axios.create({
  baseURL: `${env.API_BASE_URL}/api/v1`,
  // On the server (SSR on Vercel) the whole serverless function is killed after
  // ~10s, so any request that outlives that window turns into a hard
  // FUNCTION_INVOCATION_FAILED. Keep the server-side timeout comfortably under
  // that limit so a slow/cold backend surfaces as a handled error instead of a
  // crashed function. On the client a longer timeout is fine (it's just a
  // loading state), which also lets a cold-started backend finish waking up.
  timeout: typeof window === "undefined" ? 7_000 : 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      setToken(null);
      // Avoid infinite bounce on the login page itself.
      const path = window.location.pathname;
      if (!path.startsWith("/auth/")) {
        const redirect = encodeURIComponent(path + window.location.search);
        window.location.href = `/auth/login?redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a readable error message from an Axios rejection. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: unknown; message?: string }
      | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      const first = data.detail[0] as { msg?: string } | undefined;
      if (first?.msg) return first.msg;
    }
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}