import { api } from "@/lib/api";

export const cmsService = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const { data } = await api.get<{ data: any }>(`/cms/${key}`);
      if (data.data && Object.keys(data.data).length > 0) {
        // Merge with fallback to ensure all required fields exist
        return { ...fallback, ...data.data } as T;
      }
    } catch {
      // Fallback
    }
    return fallback;
  },

  async save<T>(key: string, content: T): Promise<T> {
    const { data } = await api.post<{ data: any }>(`/cms/${key}`, {
      data: content,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`ulmind:cms-${key}-changed`));
    }
    return data.data as T;
  },

  async reset<T>(key: string, fallback: T): Promise<T> {
    await api.delete(`/cms/${key}`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`ulmind:cms-${key}-changed`));
    }
    return fallback;
  },
};
