'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { hasRole } from '@/lib/roles';
import type { UserRole } from '@/types/next-auth';

interface AdminPanel {
  id: string;
  name: string;
  href: string;
  description: string;
  category: 'operations' | 'content' | 'system';
}

interface RolePermissions {
  [role: string]: string[]; // role -> array of panel IDs
}

const ADMIN_PANELS: AdminPanel[] = [
  // Priority Operations
  { id: 'events', name: 'Events', href: '/admin/events', description: 'Event scheduling and management', category: 'operations' },
  { id: 'forms', name: 'Forms', href: '/admin/forms', description: 'Form builder and submissions', category: 'operations' },
  { id: 'coffee-chats', name: 'Coffee Chats', href: '/admin/coffee-chats', description: 'Coffee chat scheduling', category: 'operations' },
  { id: 'interviews', name: 'Interviews', href: '/admin/interviews', description: 'Interview management', category: 'operations' },
  { id: 'analytics', name: 'Form Analytics', href: '/admin/analytics/forms', description: 'Form response analytics', category: 'operations' },
  { id: 'projects', name: 'Projects', href: '/admin/projects', description: 'Project management', category: 'operations' },
  
  // Content & People
  { id: 'newsroom', name: 'Newsroom', href: '/admin/newsroom', description: 'Blog posts and content', category: 'content' },
  { id: 'team', name: 'Team Members', href: '/admin/team', description: 'Team member profiles', category: 'content' },
  { id: 'users', name: 'Users', href: '/admin/users', description: 'User role management', category: 'content' },
  { id: 'companies', name: 'Companies', href: '/admin/companies', description: 'Partner companies', category: 'content' },
  { id: 'internships', name: 'Internships', href: '/admin/internships', description: 'Internship program', category: 'content' },
  
  // System & Site Management
  { id: 'dashboard', name: 'Dashboard', href: '/admin', description: 'Main admin dashboard', category: 'system' },
  { id: 'hero', name: 'Hero Section', href: '/admin/hero', description: 'Homepage hero content', category: 'system' },
  { id: 'about', name: 'About Section', href: '/admin/about', description: 'About page content', category: 'system' },
  { id: 'join', name: 'Join Section', href: '/admin/join', description: 'Join options and contact', category: 'system' },
  { id: 'newsletter', name: 'Newsletter', href: '/admin/newsletter', description: 'Email subscribers', category: 'system' },
  { id: 'recruitment', name: 'Recruitment', href: '/admin/recruitment', description: 'Recruitment settings', category: 'system' },
  { id: 'audit', name: 'Audit Log', href: '/admin/audit', description: 'System activity tracking', category: 'system' },
  { id: 'settings', name: 'Site Settings', href: '/admin/settings', description: 'Site metadata', category: 'system' },
  { id: 'changelog', name: 'Changelog', href: '/admin/changelog', description: 'Recent changes', category: 'system' },
];

const ROLES: UserRole[] = [
  'ADMIN',
  'PRESIDENT',
  'VP_EXTERNAL',
  'VP_OPERATIONS',
  'VP_EDUCATION',
  'VP_MARKETING',
  'VP_CONFERENCES',
  'VP_FINANCE',
  'VP_COMMUNITY',
  'VP_SPONSORSHIPS',
  'VP_RECRUITMENT',
  'VP_TECHNOLOGY',
  'ADVISOR',
  'PROJECT_TEAM_MEMBER',
  'GENERAL_MEMBER',
  'SPECIAL_PRIVS',
];

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || {});
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (role: UserRole, panelId: string) => {
    setPermissions(prev => {
      const rolePanels = prev[role] || [];
      const hasPermission = rolePanels.includes(panelId);
      
      return {
        ...prev,
        [role]: hasPermission
          ? rolePanels.filter(id => id !== panelId)
          : [...rolePanels, panelId]
      };
    });
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions saved successfully!' });
      } else {
        throw new Error('Failed to save permissions');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save permissions. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const names: Record<UserRole, string> = {
      'ADMIN': 'Administrator',
      'PRESIDENT': 'President',
      'VP_EXTERNAL': 'VP External',
      'VP_OPERATIONS': 'VP Operations',
      'VP_EDUCATION': 'VP Education',
      'VP_MARKETING': 'VP Marketing',
      'VP_CONFERENCES': 'VP Conferences',
      'VP_FINANCE': 'VP Finance',
      'VP_COMMUNITY': 'VP Community',
      'VP_SPONSORSHIPS': 'VP Sponsorships',
      'VP_RECRUITMENT': 'VP Recruitment',
      'VP_TECHNOLOGY': 'VP Technology',
      'ADVISOR': 'Advisor',
      'PROJECT_TEAM_MEMBER': 'Project Team',
      'GENERAL_MEMBER': 'General',
      'USER': 'User',
      'ROUND1': 'Round 1',
      'ROUND2': 'Round 2',
      'SPECIAL_PRIVS': 'Special Privs',
    };
    return names[role] || role;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session?.user || !hasRole(session.user.roles, 'SPECIAL_PRIVS')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need special privileges to access this page.</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredPanels = selectedCategory === 'all' 
    ? ADMIN_PANELS 
    : ADMIN_PANELS.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
              <p className="text-gray-600 text-sm">Control which roles can access admin panels</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back
              </Link>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Category Filter */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All Panels
          </button>
          <button
            onClick={() => setSelectedCategory('operations')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === 'operations' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Operations
          </button>
          <button
            onClick={() => setSelectedCategory('content')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === 'content' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Content & People
          </button>
          <button
            onClick={() => setSelectedCategory('system')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            System Settings
          </button>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="px-6">
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-900 font-medium sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                    Admin Panel
                  </th>
                  {ROLES.map(role => (
                    <th key={role} className="p-2 text-gray-900 font-medium text-center min-w-[100px]">
                      <div className="text-xs whitespace-nowrap">{getRoleDisplayName(role)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPanels.map(panel => (
                  <tr key={panel.id} className="hover:bg-gray-50">
                    <td className="p-4 sticky left-0 bg-white z-10">
                      <div className="font-medium text-gray-900">{panel.name}</div>
                      <div className="text-xs text-gray-500">{panel.description}</div>
                    </td>
                    {ROLES.map(role => {
                      const hasAccess = permissions[role]?.includes(panel.id) || false;
                      const isAdmin = role === 'ADMIN';
                      
                      return (
                        <td key={role} className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={isAdmin ? true : hasAccess}
                            disabled={isAdmin}
                            onChange={() => handleTogglePermission(role, panel.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            title={isAdmin ? 'Admins always have full access' : hasAccess ? 'Click to revoke access' : 'Click to grant access'}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Notes:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>ADMIN</strong> role always has full access to all panels (cannot be disabled)</li>
            <li>• <strong>SPECIAL_PRIVS</strong> is required to access this permissions page</li>
            <li>• Changes take effect immediately after saving</li>
            <li>• Users will only see panels they have permission to access in the sidebar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
