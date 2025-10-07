'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { USER_ROLES, getRoleDisplayName } from '@/lib/roles';
import type { UserRole } from '@/types/next-auth';

interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
  profile: {
    major?: string;
    school?: string;
    graduationYear?: number;
    phone?: string;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalUsers: number;
  };
  availableRoles: UserRole[];
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalUsers: 0
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [saving, setSaving] = useState(false);

  const loadUsers = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadUsers();
    }
  }, [session]);

  const handleSearch = () => {
    loadUsers(1, search);
  };

  const handleEditRoles = (user: User) => {
    setEditingUser(user.id);
    setSelectedRoles([...user.roles]);
  };

  const handleRoleToggle = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser,
          roles: selectedRoles
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update roles');
      }

      // Refresh the users list
      await loadUsers(pagination.current);
      setEditingUser(null);
      setSelectedRoles([]);
    } catch (err) {
      console.error('Failed to save roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to save roles');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRoles([]);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session?.user?.roles?.includes('ADMIN')) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 text-sm">Manage user roles and permissions</p>
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Total users: {pagination.totalUsers}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-gray-900 font-medium">User</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Roles</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Profile</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Joined</th>
                  <th className="text-left p-4 text-gray-900 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-600">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-600">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="text-gray-900 font-medium">{user.name}</div>
                        <div className="text-gray-600 text-sm">{user.email}</div>
                      </td>
                      <td className="p-4">
                        {editingUser === user.id ? (
                          <div className="space-y-2">
                            {USER_ROLES.map((role) => (
                              <label key={role} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={selectedRoles.includes(role)}
                                  onChange={() => handleRoleToggle(role)}
                                  className="mr-2"
                                />
                                <span className="text-gray-700">
                                  {getRoleDisplayName(role)}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  role === 'ADMIN'
                                    ? 'bg-red-100 text-red-800'
                                    : role === 'SPECIAL_PRIVS'
                                    ? 'bg-purple-100 text-purple-800'
                                    : role === 'PROJECT_TEAM_MEMBER'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {getRoleDisplayName(role)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.profile?.major && (
                          <div>Major: {user.profile.major}</div>
                        )}
                        {user.profile?.graduationYear && (
                          <div>Year: {user.profile.graduationYear}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {editingUser === user.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveRoles}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditRoles(user)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Edit Roles
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.current} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadUsers(pagination.current - 1)}
                  disabled={pagination.current === 1 || loading}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadUsers(pagination.current + 1)}
                  disabled={pagination.current === pagination.total || loading}
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