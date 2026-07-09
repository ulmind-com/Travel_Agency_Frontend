import { api, setToken } from "@/lib/api";
import type { TokenResponse, UserResponse } from "@/types/api";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
};

export const authService = {
  async register(input: RegisterInput): Promise<UserResponse> {
    const form = new FormData();
    form.append("name", input.name);
    form.append("email", input.email);
    form.append("password", input.password);
    form.append("role", "CUSTOMER");
    if (input.phone_number) form.append("phone_number", input.phone_number);
    const { data } = await api.post<UserResponse>("/auth/register", form);
    return data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    form.set("grant_type", "password");
    const { data } = await api.post<TokenResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    setToken(data.access_token);
    return data;
  },

  async me(): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>("/auth/me");
    return data;
  },

  logout() {
    setToken(null);
  },
};