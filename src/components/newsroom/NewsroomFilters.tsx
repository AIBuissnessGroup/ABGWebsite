'use client';

import { NewsroomPost, NewsroomPostType } from '@/types/newsroom';
import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface NewsroomFiltersProps {
  filters: {
    type: NewsroomPostType | 'all';
    tag: string;
    search: string;
    featured: boolean;
    page: number;
    limit: number;
  };
  availableTags: string[];
  onFiltersChange: (filters: any) => void;
  loading: boolean;
}

const POST_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'blog', label: 'Articles' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'video', label: 'Videos' },
  { value: 'member-spotlight', label: 'Member Spotlights' },
  { value: 'project-update', label: 'Project Updates' },
] as const;

export default function NewsroomFilters({ 
  filters, 
  availableTags, 
  onFiltersChange, 
  loading 
}: NewsroomFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: searchInput });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      type: 'all',
      tag: '',
      search: '',
      featured: false
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.tag !== '' || 
    filters.search !== '' || 
    filters.featured;

  return (
    <div className="mb-8">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg w-full justify-center border border-white/20"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-600 text-xs px-2 py-1 rounded-full ml-2">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filters Container */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block space-y-4 lg:space-y-0`}>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:opacity-50"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="submit"
              disabled={loading || searchInput === filters.search}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Post Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => onFiltersChange({ type: e.target.value as NewsroomPostType | 'all' })}
              disabled={loading}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:opacity-50"
            >
              {POST_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <select
              value={filters.tag}
              onChange={(e) => onFiltersChange({ tag: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:opacity-50"
            >
              <option value="">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Featured
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => onFiltersChange({ featured: e.target.checked })}
                disabled={loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-gray-300">Featured only</span>
            </label>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              disabled={loading || !hasActiveFilters}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full border border-white/20"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}