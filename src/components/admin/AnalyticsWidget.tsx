'use client';
import { useState, useEffect } from 'react';
import { ChartBarIcon, EyeIcon, UserGroupIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  topPages: { page: string; views: number }[];
  conversionRate: number;
  newsletterSignups: number;
  eventRegistrations: number;
}

export default function AnalyticsWidget() {
  const [data, setData] = useState<AnalyticsData>({
    pageViews: 0,
    uniqueVisitors: 0,
    topPages: [],
    conversionRate: 0,
    newsletterSignups: 0,
    eventRegistrations: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // This would connect to your analytics API
      // For now, we'll show sample data
      
      // In a real implementation, you'd fetch from:
      // const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      // const analytics = await res.json();
      
      // Sample data for demonstration
      setTimeout(() => {
        setData({
          pageViews: Math.floor(Math.random() * 1000) + 500,
          uniqueVisitors: Math.floor(Math.random() * 300) + 200,
          topPages: [
            { page: '/', views: Math.floor(Math.random() * 200) + 100 },
            { page: '/events', views: Math.floor(Math.random() * 150) + 50 },
            { page: '/projects', views: Math.floor(Math.random() * 100) + 30 },
            { page: '/team', views: Math.floor(Math.random() * 80) + 20 },
          ],
          conversionRate: Math.random() * 5 + 2,
          newsletterSignups: Math.floor(Math.random() * 20) + 5,
          eventRegistrations: Math.floor(Math.random() * 15) + 3,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : formatNumber(value)}</p>
          </div>
        </div>
        {change && (
          <div className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Website Analytics
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Powered by Google Analytics
            </p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={EyeIcon}
            title="Page Views"
            value={data.pageViews}
            change={8.2}
            color="bg-blue-500"
          />
          <StatCard
            icon={UserGroupIcon}
            title="Unique Visitors"
            value={data.uniqueVisitors}
            change={12.1}
            color="bg-green-500"
          />
          <StatCard
            icon={CursorArrowRaysIcon}
            title="Newsletter Signups"
            value={data.newsletterSignups}
            change={-2.3}
            color="bg-purple-500"
          />
          <StatCard
            icon={ChartBarIcon}
            title="Event Registrations"
            value={data.eventRegistrations}
            change={25.4}
            color="bg-orange-500"
          />
        </div>

        {/* Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Top Pages</h4>
            <div className="space-y-2">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                data.topPages.map((page, idx) => (
                  <div key={page.page} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{page.page}</span>
                    </div>
                    <span className="text-sm text-gray-600">{formatNumber(page.views)} views</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Quick Insights</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded border border-blue-100">
                <p className="text-sm font-medium text-blue-900">Conversion Rate</p>
                <p className="text-lg font-bold text-blue-800">{loading ? '...' : data.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-blue-700">Newsletter signups / visitors</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded border border-green-100">
                <p className="text-sm font-medium text-green-900">Engagement</p>
                <p className="text-lg font-bold text-green-800">High</p>
                <p className="text-xs text-green-700">Users spend 2.5 min on average</p>
              </div>

              <div className="p-3 bg-purple-50 rounded border border-purple-100">
                <p className="text-sm font-medium text-purple-900">Growth</p>
                <p className="text-lg font-bold text-purple-800">+15%</p>
                <p className="text-xs text-purple-700">Compared to last period</p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Analytics Setup</h4>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            To see real analytics data, add your Google Analytics 4 Measurement ID to your environment variables.
          </p>
          <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
            <p className="text-xs font-mono text-yellow-800">
              NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
            </p>
          </div>
          <p className="text-xs text-yellow-600 mt-2">
            Get your Measurement ID from{' '}
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-yellow-800"
            >
              Google Analytics
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 