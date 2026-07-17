import { api } from "@/lib/api";
import type { Blog } from "@/types/blog";

// --- PUBLIC APIs ---
export const getPublicBlogs = async (params?: Record<string, any>) => {
  const { data } = await api.get<Blog[]>("/public/blogs", { params });
  return data;
};

export const getFeaturedBlogs = async (limit = 5) => {
  const { data } = await api.get<Blog[]>("/public/blogs/featured", { params: { limit } });
  return data;
};

export const getTrendingBlogs = async (limit = 5) => {
  const { data } = await api.get<Blog[]>("/public/blogs/trending", { params: { limit } });
  return data;
};

export const getBlogBySlug = async (slug: string) => {
  const { data } = await api.get<Blog>(`/public/blogs/${slug}`);
  return data;
};

export const translatePublicBlog = async (slug: string, lang: string) => {
  const { data } = await api.post<{ title: string; subtitle: string; content: string }>(`/public/blogs/${slug}/translate`, { lang });
  return data;
};

// --- ADMIN APIs ---
export const getAdminBlogs = async (params?: Record<string, any>) => {
  const { data } = await api.get<{ data: Blog[]; total: number }>("/admin/blogs", { params });
  return data;
};

export const createAdminBlog = async (payload: Partial<Blog>) => {
  const { data } = await api.post<Blog>("/admin/blogs", payload);
  return data;
};

export const updateAdminBlog = async (id: string, payload: Partial<Blog>) => {
  const { data } = await api.patch<Blog>(`/admin/blogs/${id}`, payload);
  return data;
};

export const deleteAdminBlog = async (id: string) => {
  const { data } = await api.delete(`/admin/blogs/${id}`);
  return data;
};
