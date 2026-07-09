import { api } from "@/lib/api";
import type { CloudinaryMedia } from "@/types/api";

export const mediaService = {
  async upload(file: File): Promise<CloudinaryMedia> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<CloudinaryMedia>("/media/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};