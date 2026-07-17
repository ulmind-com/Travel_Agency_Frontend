export type BlogStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface CloudinaryMedia {
  url: string;
  public_id: string;
}

export interface BlogSEO {
  title?: string;
  description?: string;
  keywords: string[];
  og_image?: CloudinaryMedia;
  canonical_url?: string;
  structured_data?: any;
}

export interface BlogStats {
  views: number;
  unique_views: number;
  likes: number;
  bookmarks: number;
  shares: number;
  comments_count: number;
  average_read_time?: number;
  bounce_rate?: number;
  completion_rate?: number;
}

export interface Blog {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  short_description?: string;
  long_description?: string;
  content: string;
  category: string;
  tags: string[];
  author_id: string;
  author_name?: string;
  author_bio?: string;
  author_photo?: CloudinaryMedia;
  hero_image?: CloudinaryMedia;
  thumbnail?: CloudinaryMedia;
  cover_video?: CloudinaryMedia;
  gallery: CloudinaryMedia[];
  reading_time: number;
  featured: boolean;
  editors_pick: boolean;
  trending: boolean;
  seo: BlogSEO;
  stats: BlogStats;
  status: BlogStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
}
