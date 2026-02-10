'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { USER_ROLES, getRoleDisplayName, EXEC_ROLES } from '@/lib/roles';
import { isAdmin } from '@/lib/admin';
import type { UserRole } from '@/types/next-auth';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  PencilIcon,
  CheckIcon,
  UserGroupIcon,
  LinkIcon,
  TrashIcon,
  FunnelIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
  teamMemberId?: string;
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalUsers: 0
  });
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    roles: [] as UserRole[],
    teamMemberId: '',
    major: '',
    school: '',
    graduationYear: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRole, setBulkRole] = useState<UserRole>('USER');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (session?.user) {
        loadUsers(1, search, roleFilter);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, session]);

  const loadUsers = async (page = 1, searchTerm = search, role = roleFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }
      if (role) {
        params.set('role', role);
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

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadTeamMembers();
    }
  }, [session]);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      roles: [...user.roles],
      teamMemberId: user.teamMemberId || '',
      major: user.profile?.major || '',
      school: user.profile?.school || '',
      graduationYear: user.profile?.graduationYear?.toString() || '',
      phone: user.profile?.phone || ''
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      name: '',
      roles: [],
      teamMemberId: '',
      major: '',
      school: '',
      graduationYear: '',
      phone: ''
    });
  };

  // Check if user has exec roles that should show on team page
  const hasExecRole = (roles: UserRole[]) => {
    return roles.some(role => EXEC_ROLES.includes(role));
  };

  // Get the display role (for team page) based on user's roles
  const getTeamRole = (roles: UserRole[]): string => {
    if (roles.includes('PRESIDENT')) return 'President';
    if (roles.includes('VP_TECHNOLOGY')) return 'VP of Technology';
    if (roles.includes('VP_EXTERNAL')) return 'VP of External Relations';
    if (roles.includes('VP_OPERATIONS')) return 'VP of Operations';
    if (roles.includes('VP_EDUCATION')) return 'VP of Education';
    if (roles.includes('VP_MARKETING')) return 'VP of Marketing';
    if (roles.includes('VP_CONFERENCES')) return 'VP of Conferences';
    if (roles.includes('VP_FINANCE')) return 'VP of Finance';
    if (roles.includes('VP_COMMUNITY')) return 'VP of Community';
    if (roles.includes('VP_SPONSORSHIPS')) return 'VP of Sponsorships';
    if (roles.includes('VP_RECRUITMENT')) return 'VP of Recruitment';
    if (roles.includes('ADVISOR')) return 'Advisor';
    return 'Team Member';
  };

  // Create a new team member profile for this user
  const createTeamMemberFromUser = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      
      const teamMemberData = {
        name: editForm.name || editingUser.name || editingUser.email.split('@')[0],
        role: getTeamRole(editForm.roles),
        year: editForm.graduationYear || new Date().getFullYear().toString(),
        major: editForm.major || null,
        email: editingUser.email,
        bio: null,
        linkedIn: null,
        github: null,
        imageUrl: null,
        featured: editForm.roles.includes('PRESIDENT'),
        active: true,
        memberType: 'exec',
        sortOrder: 0,
        joinDate: new Date()
      };

      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamMemberData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team member');
      }

      const result = await response.json();
      const newTeamMemberId = result.id || result._id;

      // Link the user to the new team member
      setEditForm({ ...editForm, teamMemberId: newTeamMemberId });
      
      // Reload team members list
      await loadTeamMembers();
      
      toast.success('Team member profile created! Click Save to link it.');
    } catch (err) {
      console.error('Failed to create team member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create team member');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    if (editForm.roles.includes(role)) {
      setEditForm({ ...editForm, roles: editForm.roles.filter(r => r !== role) });
    } else {
      setEditForm({ ...editForm, roles: [...editForm.roles, role] });
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      
      // Update roles
      const rolesResponse = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          roles: editForm.roles
        }),
      });

      if (!rolesResponse.ok) {
        const error = await rolesResponse.json();
        throw new Error(error.error || 'Failed to update roles');
      }

      // Update profile and team member link
      const profileResponse = await fetch('/api/admin/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editForm.name,
          teamMemberId: editForm.teamMemberId || null,
          profile: {
            major: editForm.major || null,
            school: editForm.school || null,
            graduationYear: editForm.graduationYear ? parseInt(editForm.graduationYear) : null,
            phone: editForm.phone || null
          }
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      toast.success('User updated successfully');
      await loadUsers(pagination.current);
      closeEditModal();
    } catch (err) {
      console.error('Failed to save user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;
    
    try {
      setSaving(true);
      
      if (bulkAction === 'addRole' || bulkAction === 'removeRole') {
        const response = await fetch('/api/admin/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: Array.from(selectedUsers),
            action: bulkAction,
            role: bulkRole
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Bulk action failed');
        }

        toast.success(`Successfully updated ${selectedUsers.size} users`);
      }
      
      await loadUsers(pagination.current);
      setSelectedUsers(new Set());
      setBulkAction('');
    } catch (err) {
      console.error('Bulk action failed:', err);
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
      case 'PRESIDENT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VP_TECH': 
      case 'VP_MARKETING':
      case 'VP_FINANCE':
      case 'VP_OPERATIONS':
      case 'VP_INTERNAL':
      case 'VP_EXTERNAL':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PROJECT_TEAM_MEMBER': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SPECIAL_PRIVS': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin(session?.user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
          <Link href="/admin" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 text-sm">
                {pagination.totalUsers} total users
                {selectedUsers.size > 0 && ` • ${selectedUsers.size} selected`}
              </p>
            </div>
            <Link 
              href="/admin"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 min-w-[180px]"
              >
                <option value="">All Roles</option>
                {USER_ROLES.map(role => (
                  <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                Bulk Actions:
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900"
              >
                <option value="">Select action...</option>
                <option value="addRole">Add Role</option>
                <option value="removeRole">Remove Role</option>
              </select>
              {bulkAction && (
                <>
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value as UserRole)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900"
                  >
                    {USER_ROLES.map(role => (
                      <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={saving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Apply
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-4 text-gray-900 font-semibold text-sm">User</th>
                  <th className="text-left p-4 text-gray-900 font-semibold text-sm">Roles</th>
                  <th className="text-left p-4 text-gray-900 font-semibold text-sm">Profile</th>
                  <th className="text-left p-4 text-gray-900 font-semibold text-sm">Team Member</th>
                  <th className="text-left p-4 text-gray-900 font-semibold text-sm">Joined</th>
                  <th className="text-right p-4 text-gray-900 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{user.name || 'Unnamed'}</div>
                        <div className="text-gray-500 text-sm">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeColor(role)}`}
                            >
                              {getRoleDisplayName(role)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.profile?.major && <div>{user.profile.major}</div>}
                        {user.profile?.graduationYear && <div>Class of {user.profile.graduationYear}</div>}
                        {!user.profile?.major && !user.profile?.graduationYear && (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {user.teamMemberId ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <LinkIcon className="w-4 h-4" />
                            Linked
                          </span>
                        ) : (
                          <span className="text-gray-400">Not linked</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit
                        </button>
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
              <div className="text-sm text-gray-600">
                Page {pagination.current} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadUsers(pagination.current - 1)}
                  disabled={pagination.current === 1 || loading}
                  className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 border border-gray-200 rounded-lg text-sm transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadUsers(pagination.current + 1)}
                  disabled={pagination.current === pagination.total || loading}
                  className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 border border-gray-200 rounded-lg text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                  <p className="text-gray-600 text-sm">{editingUser.email}</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {USER_ROLES.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        editForm.roles.includes(role)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{getRoleDisplayName(role)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Team Member Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Link to Team Member
                </label>
                
                {/* Warning when user has exec role but no team member */}
                {hasExecRole(editForm.roles) && !editForm.teamMemberId && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium">
                          This user has an executive role but no team member profile
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          They won&apos;t appear on the public team page until linked to a team member.
                        </p>
                        <button
                          type="button"
                          onClick={createTeamMemberFromUser}
                          disabled={saving}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Create Team Member Profile
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <select
                  value={editForm.teamMemberId}
                  onChange={(e) => setEditForm({ ...editForm, teamMemberId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Not linked</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} - {tm.role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Link this user account to a team member profile for the public team page.
                </p>
              </div>

              {/* Profile Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Information</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Major</label>
                    <input
                      type="text"
                      value={editForm.major}
                      onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                      placeholder="e.g., Computer Science"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">School</label>
                    <input
                      type="text"
                      value={editForm.school}
                      onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                      placeholder="e.g., College of Engineering"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Graduation Year</label>
                    <input
                      type="number"
                      value={editForm.graduationYear}
                      onChange={(e) => setEditForm({ ...editForm, graduationYear: e.target.value })}
                      placeholder="e.g., 2026"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g., (555) 123-4567"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
