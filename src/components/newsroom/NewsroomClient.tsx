'use client';

import { useState, useEffect } from 'react';
import { NewsroomPost, NewsroomPostType } from '@/types/newsroom';
import NewsroomGrid from './NewsroomGrid';
import NewsroomFilters from './NewsroomFilters';
import FloatingShapes from '../FloatingShapes';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface NewsroomData {
  posts: NewsroomPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  availableTags: string[];
}

export default function NewsroomClient() {
  const [data, setData] = useState<NewsroomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    type: 'all' as NewsroomPostType | 'all',
    tag: '',
    search: '',
    featured: false,
    page: 1,
    limit: 12
  });

  // Fetch posts based on current filters
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      params.append('sortBy', 'datePublished');
      params.append('sortOrder', 'desc');
      
      const response = await fetch(`/api/newsroom?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#00274c] relative">
        <FloatingShapes />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Error Loading Newsroom</h1>
            <p className="text-xl mb-8">{error}</p>
            <button
              onClick={() => fetchPosts()}
              className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00274c] relative">
      <FloatingShapes />
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">
            ABG Newsroom
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Stay updated with the latest news, insights, and stories from the AI Business Group. 
            Explore our articles, podcasts, videos, and member spotlights.
          </p>
        </div>

        {/* Filters */}
        <NewsroomFilters
          filters={filters}
          availableTags={data?.availableTags || []}
          onFiltersChange={handleFilterChange}
          loading={loading}
        />

        {/* Results Count */}
        {data && (
          <div className="text-center mb-8">
            <p className="text-gray-300">
              {data.pagination.total === 0 
                ? 'No posts found'
                : `Showing ${((data.pagination.page - 1) * data.pagination.limit) + 1}-${Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of ${data.pagination.total} posts`
              }
            </p>
          </div>
        )}

        {/* Posts Grid */}
        <NewsroomGrid posts={data?.posts || []} loading={loading} />

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => handlePageChange(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors border border-white/20"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
                .filter(page => {
                  const current = data.pagination.page;
                  return page === 1 || 
                         page === data.pagination.pages || 
                         (page >= current - 2 && page <= current + 2);
                })
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return [
                      <span key={`ellipsis-${page}`} className="text-gray-400 px-2">...</span>,
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg ${
                          page === data.pagination.page
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        } transition-colors`}
                      >
                        {page}
                      </button>
                    ];
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg ${
                        page === data.pagination.page
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      } transition-colors`}
                    >
                      {page}
                    </button>
                  );
                })}
            </div>
            
            <button
              onClick={() => handlePageChange(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.pages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors border border-white/20"
            >
              Next
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}