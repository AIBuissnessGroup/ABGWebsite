export interface NewsroomPost {
  _id?: string;
  title: string;
  slug: string;
  type: 'blog' | 'podcast' | 'video' | 'member-spotlight' | 'project-update';
  status: 'draft' | 'published' | 'archived';
  thumbnail?: string;
  description: string;
  body: string; // Rich text content
  mediaEmbedLink?: string; // YouTube, Spotify, etc.
  author: string;
  authorEmail: string;
  datePublished?: Date;
  featured: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  openGraphImage?: string;
  analytics: {
    views: number;
    uniqueViews: number;
    averageTimeOnPage?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsroomAnalytics {
  _id?: string;
  postId: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  timeOnPage?: number;
  scrollDepth?: number;
  viewedAt: Date;
}

export interface NewsroomFilter {
  type?: 'blog' | 'podcast' | 'video' | 'member-spotlight' | 'project-update' | 'all';
  tag?: string;
  search?: string;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'datePublished' | 'title' | 'views' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsroomStats {
  totalPosts: number;
  totalViews: number;
  totalUniqueViews: number;
  averageTimeOnPage: number;
  topPosts: Array<{
    _id: string;
    title: string;
    views: number;
    uniqueViews: number;
  }>;
  postsByType: Record<string, number>;
  viewsOverTime: Array<{
    date: string;
    views: number;
    uniqueViews: number;
  }>;
}

export type NewsroomPostType = NewsroomPost['type'];
export type NewsroomPostStatus = NewsroomPost['status'];