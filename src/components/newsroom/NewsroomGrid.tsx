'use client';

import { NewsroomPost } from '@/types/newsroom';
import PostCard from './PostCard';

interface NewsroomGridProps {
  posts: NewsroomPost[];
  loading: boolean;
}

export default function NewsroomGrid({ posts, loading }: NewsroomGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white/10 rounded-xl overflow-hidden">
              <div className="aspect-video bg-white/20"></div>
              <div className="p-6">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-5/6 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-white/20 rounded w-1/4"></div>
                  <div className="h-3 bg-white/20 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3v6m0 0l3-3m-3 3L9 9.5" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">No posts found</h3>
          <p className="text-white/60 mb-6">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}