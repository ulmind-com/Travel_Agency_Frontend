/**
 * Document Vault — API layer.
 * Admin surface (all users) + customer self-service ("my documents").
 * Files are stored in Cloudinary; preview/download always return short-lived
 * signed URLs (never raw asset URLs for identity documents).
 */
import { api } from "@/lib/api";
import type { Paged } from "@/types/admin.security";
import type { VaultDoc, VaultOverview, VaultStorage } from "@/types/admin.vault";

export const vaultAdminService = {
  overview: async (): Promise<VaultOverview> =>
    (await api.get("/admin/documents/overview")).data,

  list: async (params: Record<string, unknown>): Promise<Paged<VaultDoc>> =>
    (await api.get("/admin/documents", { params })).data,

  detail: async (id: string): Promise<VaultDoc> =>
    (await api.get(`/admin/documents/${id}`)).data,

  events: async (params: Record<string, unknown>) =>
    (await api.get("/admin/documents/events", { params })).data,

  backfill: async () => (await api.post("/admin/documents/backfill")).data,

  upload: async (form: FormData): Promise<VaultDoc> =>
    (await api.post("/admin/documents/upload", form)).data,

  downloadUrl: async (id: string, version?: number): Promise<{ url: string }> =>
    (await api.get(`/admin/documents/${id}/download`, { params: { version } })).data,

  previewUrl: async (id: string): Promise<{ url: string; resource_type: string; format?: string }> =>
    (await api.get(`/admin/documents/${id}/preview`)).data,

  verify: async (id: string, status: "VERIFIED" | "REJECTED" | "PENDING", note?: string) =>
    (await api.post(`/admin/documents/${id}/verify`, { status, note })).data,

  remove: async (id: string, hard: boolean, reason?: string) =>
    (await api.delete(`/admin/documents/${id}`, { data: { hard, reason } })).data,

  restore: async (id: string) =>
    (await api.post(`/admin/documents/${id}/restore`)).data,
};

export const myVaultService = {
  meta: async (): Promise<{ categories: string[]; statuses: string[]; verification: string[] }> =>
    (await api.get("/documents/meta")).data,

  list: async (params: Record<string, unknown>): Promise<{ items: VaultDoc[]; storage: VaultStorage }> =>
    (await api.get("/documents", { params })).data,

  detail: async (id: string): Promise<VaultDoc> =>
    (await api.get(`/documents/${id}`)).data,

  upload: async (form: FormData): Promise<VaultDoc> =>
    (await api.post("/documents", form)).data,

  addVersion: async (id: string, form: FormData): Promise<VaultDoc> =>
    (await api.post(`/documents/${id}/versions`, form)).data,

  previewUrl: async (id: string): Promise<{ url: string; resource_type: string; format?: string }> =>
    (await api.get(`/documents/${id}/preview`)).data,

  downloadUrl: async (id: string, version?: number): Promise<{ url: string }> =>
    (await api.get(`/documents/${id}/download`, { params: { version } })).data,

  update: async (id: string, body: Record<string, unknown>) =>
    (await api.patch(`/documents/${id}`, body)).data,

  share: async (id: string, body: { expires_in_hours: number; watermark: boolean; max_access?: number | null }):
    Promise<{ token: string; url: string; expires_at: string; watermark: boolean; max_access?: number | null }> =>
    (await api.post(`/documents/${id}/share`, body)).data,

  revokeShare: async (id: string, token: string) =>
    (await api.delete(`/documents/${id}/share/${token}`)).data,

  remove: async (id: string, reason?: string) =>
    (await api.delete(`/documents/${id}`, { params: { reason } })).data,

  restore: async (id: string) =>
    (await api.post(`/documents/${id}/restore`)).data,
};
