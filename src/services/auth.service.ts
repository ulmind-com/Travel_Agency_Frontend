import { api, setToken } from "@/lib/api";
import type { TokenResponse, UserResponse } from "@/types/api";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  referral_code?: string;
};

/** Fire-and-forget device fingerprint enrichment after a session opens. */
function submitFingerprint() {
  try {
    api.post("/auth/fingerprint", {
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform || navigator.userAgent.slice(0, 32),
    }).catch(() => {});
  } catch { /* SSR */ }
}

export const authService = {
  async register(input: RegisterInput): Promise<UserResponse> {
    const form = new FormData();
    form.append("name", input.name);
    form.append("email", input.email);
    form.append("password", input.password);
    form.append("role", "CUSTOMER");
    if (input.phone_number) form.append("phone_number", input.phone_number);
    if (input.referral_code) form.append("referral_code", input.referral_code);
    const { data } = await api.post<UserResponse>("/auth/register", form);
    return data;
  },

  /**
   * Password login. When the account has 2FA enabled the response carries
   * `requires_2fa` + a 5-minute `pre_auth_token` instead of an access token —
   * finish with `verify2fa()`.
   */
  async login(email: string, password: string): Promise<TokenResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    form.set("grant_type", "password");
    const { data } = await api.post<TokenResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (data.access_token && !data.requires_2fa) {
      setToken(data.access_token);
      submitFingerprint();
    }
    return data;
  },

  /** Exchange the pre-auth token + a second factor for real tokens. */
  async verify2fa(pre_auth_token: string, code: string,
    method: "TOTP" | "EMAIL_OTP" | "RECOVERY_CODE"): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/2fa/verify", {
      pre_auth_token, code, method,
    });
    if (data.access_token) {
      setToken(data.access_token);
      submitFingerprint();
    }
    return data;
  },

  /** Ask the server to email a one-time code for a pending 2FA challenge. */
  async request2faEmailOtp(pre_auth_token: string): Promise<{ status: string; to: string }> {
    const { data } = await api.post("/auth/2fa/email-otp", { pre_auth_token });
    return data;
  },

  async me(): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>("/auth/me");
    return data;
  },

  logout() {
    // Fire-and-forget server-side session teardown (records the live logout
    // event + clears Redis sessions) before dropping the local token.
    api.post("/auth/logout").catch(() => {});
    setToken(null);
  },
};
