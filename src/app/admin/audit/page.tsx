'use client';

import { useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChartBarIcon, FunnelIcon, ArrowPathIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { isAdmin } from '@/lib/admin';

interface AuditLogEntry {
  _id: string;
  userId: string;
  userEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userEmail: string; count: number }>;
}

interface AuditResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminAuditPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    userEmail: '',
    targetType: '',
    page: 1
  });

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    totalPages: 1,
    totalLogs: 0
  });

  const loadLogs = async (newFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (newFilters.action) params.set('action', newFilters.action);
      if (newFilters.userEmail) params.set('userEmail', newFilters.userEmail);
      if (newFilters.targetType) params.set('targetType', newFilters.targetType);
      params.set('page', newFilters.page.toString());
      params.set('limit', '25');

      const response = await fetch(`/api/admin/audit?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data: AuditResponse = await response.json();
      setLogs(data.logs);
      setPagination({
        current: data.page,
        total: data.total,
        totalPages: data.totalPages,
        totalLogs: data.total
      });
      setError('');
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/admin/audit?stats=true');
      if (!response.ok) {
        throw new Error('Failed to fetch audit statistics');
      }
      
      const data: AuditStats = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load audit statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadLogs();
      loadStats();
    }
  }, [session]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { action: '', userEmail: '', targetType: '', page: 1 };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'text-green-700';
    if (action.includes('deleted')) return 'text-red-700';
    if (action.includes('updated') || action.includes('changed')) return 'text-blue-700';
    if (action.includes('failed') || action.includes('denied')) return 'text-red-700';
    return 'text-gray-700';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin(session?.user)) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin privileges to access audit logs.</p>
          <Link href="/admin" className="text-blue-400 hover:underline mt-4 inline-block">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 text-sm">Track all user actions and system events</p>
            </div>
            <Link 
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.totalLogs.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.todayLogs || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Top Actions</p>
            {loadingStats ? (
              <p className="text-gray-900">Loading...</p>
            ) : (
              <div className="space-y-1">
                {stats?.topActions.slice(0, 3).map((action, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-gray-900">{action.action}</span>
                    <span className="text-gray-600 ml-2">({action.count})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Top Users</p>
            {loadingStats ? (
              <p className="text-gray-900">Loading...</p>
            ) : (
              <div className="space-y-1">
                {stats?.topUsers.slice(0, 3).map((user, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-gray-900">{user.userEmail.split('@')[0]}</span>
                    <span className="text-gray-600 ml-2">({user.count})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-gray-900 font-medium">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Action</label>
              <input
                type="text"
                placeholder="e.g., user.role_changed"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">User Email</label>
              <input
                type="text"
                placeholder="user@umich.edu"
                value={filters.userEmail}
                onChange={(e) => handleFilterChange('userEmail', e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">Target Type</label>
              <select
                value={filters.targetType}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="User">User</option>
                <option value="Event">Event</option>
                <option value="Project">Project</option>
                <option value="Content">Content</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-gray-900 font-medium">Recent Activity</h3>
            <button
              onClick={() => loadLogs()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-gray-900 font-medium w-8"></th>
                  <th className="text-left p-4 text-gray-900 font-medium">Timestamp</th>
                  <th className="text-left p-4 text-gray-900 font-medium">User</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Action</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Target</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-600">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-600">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="p-4">
                          <button
                            onClick={() => toggleRowExpansion(log._id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {expandedRows.has(log._id) ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="p-4">
                          <div className="text-gray-900 text-sm">{log.userEmail}</div>
                          {log.ip && (
                            <div className="text-gray-500 text-xs">{log.ip}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-900 text-sm">{log.targetType}</div>
                          {log.targetId && (
                            <div className="text-gray-500 text-xs">{log.targetId}</div>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {log.meta && Object.keys(log.meta).length > 0 ? (
                            <div className="text-gray-500">
                              {expandedRows.has(log._id) ? 'Details expanded below' : 'Click arrow to view details'}
                            </div>
                          ) : (
                            <span className="text-gray-400">No additional details</span>
                          )}
                        </td>
                      </tr>
                      {expandedRows.has(log._id) && (
                        <tr key={`${log._id}-expanded`} className="bg-gray-50">
                          <td className="p-4"></td>
                          <td colSpan={5} className="p-4">
                            <div className="bg-white rounded border p-4">
                              <h4 className="font-medium text-gray-900 mb-3">Detailed Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">User Agent:</span>
                                  <div className="text-gray-600 mt-1 break-all">
                                    {log.userAgent || 'Not recorded'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">IP Address:</span>
                                  <div className="text-gray-600 mt-1">
                                    {log.ip || 'Not recorded'}
                                  </div>
                                </div>
                                {log.meta && Object.keys(log.meta).length > 0 && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium text-gray-700">Metadata:</span>
                                    <div className="bg-gray-100 rounded p-3 mt-1">
                                      <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(log.meta, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.current} of {pagination.totalPages} ({pagination.totalLogs} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1 || loading}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.totalPages || loading}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}