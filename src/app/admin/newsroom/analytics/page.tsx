'use client';

import { useState, useEffect } from 'react';
import { NewsroomStats } from '@/types/newsroom';
import { 
  EyeIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function NewsroomAnalyticsPage() {
  const [stats, setStats] = useState<NewsroomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/newsroom/analytics?days=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Newsroom Analytics</h1>
          <p className="text-gray-600">
            Performance insights for your newsroom content
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Posts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalViews)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unique Views</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalUniqueViews)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Time on Page</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(stats.averageTimeOnPage)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Performing Posts */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h3>
          <div className="space-y-4">
            {stats.topPosts.slice(0, 5).map((post, index) => (
              <div key={post._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.uniqueViews} unique views
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatNumber(post.views)}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
              </div>
            ))}
            
            {stats.topPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No post data available</p>
            )}
          </div>
        </div>

        {/* Content Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Type Distribution</h3>
          <div className="space-y-4">
            {Object.entries(stats.postsByType).map(([type, count]) => {
              const total = Object.values(stats.postsByType).reduce((sum, c) => sum + c, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
              
              const typeLabels: Record<string, string> = {
                blog: 'Articles',
                podcast: 'Podcasts',
                video: 'Videos',
                'member-spotlight': 'Member Spotlights',
                'project-update': 'Project Updates',
              };
              
              const colors: Record<string, string> = {
                blog: 'bg-blue-500',
                podcast: 'bg-purple-500',
                video: 'bg-red-500',
                'member-spotlight': 'bg-green-500',
                'project-update': 'bg-orange-500',
              };
              
              return (
                <div key={type} className="flex items-center">
                  <div className="flex items-center flex-1">
                    <div className={`w-3 h-3 rounded-full ${colors[type] || 'bg-gray-400'} mr-3`}></div>
                    <span className="text-sm text-gray-900">{typeLabels[type] || type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{percentage}%</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(stats.postsByType).length === 0 && (
              <p className="text-gray-500 text-center py-4">No posts published yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Views Over Time Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
        
        {stats.viewsOverTime.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex items-end space-x-2 min-w-max pb-4" style={{ height: '200px' }}>
              {stats.viewsOverTime.map((day, index) => {
                const maxViews = Math.max(...stats.viewsOverTime.map(d => d.views));
                const height = maxViews > 0 ? (day.views / maxViews) * 160 : 0;
                
                return (
                  <div key={day.date} className="flex flex-col items-center">
                    <div className="flex flex-col items-center mb-2">
                      <div
                        className="bg-blue-500 rounded-t min-w-[30px] hover:bg-blue-600 transition-colors cursor-pointer relative group"
                        style={{ height: `${Math.max(height, 2)}px` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day.views} views ({day.uniqueViews} unique)
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-bottom-left">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 views</span>
              <span>{Math.max(...stats.viewsOverTime.map(d => d.views))} views</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No view data available for the selected time period</p>
          </div>
        )}
      </div>
    </div>
  );
}