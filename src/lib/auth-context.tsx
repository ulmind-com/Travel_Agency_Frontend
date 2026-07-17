import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getToken } from "./api";
import { authMeQuery } from "./queries";
import { authService } from "@/services/auth.service";
import type { UserResponse } from "@/types/api";

type AuthContextValue = {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useTokenPresence(): boolean {
  const [present, setPresent] = useState<boolean>(() => Boolean(getToken()));
  useEffect(() => {
    const sync = () => setPresent(Boolean(getToken()));
    window.addEventListener("ulmind:auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ulmind:auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return present;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = useTokenPresence();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    ...authMeQuery(),
    enabled: hasToken,
  });

  const logout = useCallback(() => {
    authService.logout();
    queryClient.clear();
    navigate({ to: "/" });
  }, [queryClient, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: hasToken ? data ?? null : null,
      isAuthenticated: hasToken && Boolean(data),
      isAdmin: hasToken && (data?.role === "ADMIN" || data?.role === "SUPER_ADMIN"),
      isSuperAdmin: hasToken && data?.role === "SUPER_ADMIN",
      isLoading: hasToken && isLoading,
      refresh: async () => {
        await refetch();
      },
      logout,
    }),
    [hasToken, data, isLoading, refetch, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}