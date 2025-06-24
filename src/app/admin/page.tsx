'use client';
import { useState, useEffect } from 'react';
import { 
  HomeIcon,
  InformationCircleIcon,
  HandRaisedIcon,
  FolderIcon,
  CalendarIcon,
  UserGroupIcon,
  PencilIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  resource: string;
  timestamp: string;
  changes: string;
}

export default function AdminDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load audit logs
    const loadAuditLogs = async () => {
      try {
        const response = await fetch('/api/admin/audit');
        if (response.ok) {
          const logs = await response.json();
          setAuditLogs(logs);
        }
      } catch (error) {
        console.error('Failed to load audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'hero': return '🏠';
      case 'about': return 'ℹ️';
      case 'join': return '🤝';
      case 'project': return '🚀';
      case 'event': return '📅';
      case 'team': return '👥';
      default: return '📄';
    }
  };

  const quickActions = [
    {
      title: 'Edit Homepage',
      description: 'Update hero section content',
      icon: HomeIcon,
      color: 'bg-blue-500',
      href: '/admin/content?tab=hero',
    },
    {
      title: 'Edit About',
      description: 'Update about section and values',
      icon: InformationCircleIcon,
      color: 'bg-green-500',
      href: '/admin/content?tab=about',
    },
    {
      title: 'Edit Join Section',
      description: 'Update join options and contact info',
      icon: HandRaisedIcon,
      color: 'bg-purple-500',
      href: '/admin/content?tab=join',
    },
    {
      title: 'Manage Projects',
      description: 'Add, edit, or remove projects',
      icon: FolderIcon,
      color: 'bg-orange-500',
      href: '/admin/content?tab=projects',
    },
    {
      title: 'Manage Events',
      description: 'Schedule and manage events',
      icon: CalendarIcon,
      color: 'bg-indigo-500',
      href: '/admin/content?tab=events',
    },
    {
      title: 'Manage Team',
      description: 'Add and update team members',
      icon: UserGroupIcon,
      color: 'bg-pink-500',
      href: '/admin/content?tab=team',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your ABG website content and monitor activity.</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/content" className="btn-secondary flex items-center gap-2">
            <PencilIcon className="w-4 h-4" />
            Edit Content
          </a>
          <a href="/" target="_blank" className="btn-primary flex items-center gap-2">
            <EyeIcon className="w-4 h-4" />
            View Website
          </a>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600 mt-1">Quickly access and edit different sections of your website</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600 mt-1">Track all changes made to your website content</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity to show</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getResourceIcon(log.resource)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{log.resource}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.changes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{log.userEmail}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Site Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Site Overview</h2>
          <p className="text-sm text-gray-600 mt-1">Quick overview of your website sections</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="font-medium text-gray-900">Homepage</h3>
                  <p className="text-sm text-gray-600">Hero & main content</p>
                </div>
              </div>
              <a href="/admin/content?tab=hero" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Edit →
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h3 className="font-medium text-gray-900">About Section</h3>
                  <p className="text-sm text-gray-600">Organization info & values</p>
                </div>
              </div>
              <a href="/admin/content?tab=about" className="text-green-600 hover:text-green-800 text-sm font-medium">
                Edit →
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="font-medium text-gray-900">Join Section</h3>
                  <p className="text-sm text-gray-600">Membership & contact</p>
                </div>
              </div>
              <a href="/admin/content?tab=join" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                Edit →
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h3 className="font-medium text-gray-900">Projects</h3>
                  <p className="text-sm text-gray-600">Project showcases</p>
                </div>
              </div>
              <a href="/admin/content?tab=projects" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                Manage →
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-medium text-gray-900">Events</h3>
                  <p className="text-sm text-gray-600">Upcoming events</p>
                </div>
              </div>
              <a href="/admin/content?tab=events" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Manage →
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="font-medium text-gray-900">Team</h3>
                  <p className="text-sm text-gray-600">Team members</p>
                </div>
              </div>
              <a href="/admin/content?tab=team" className="text-pink-600 hover:text-pink-800 text-sm font-medium">
                Manage →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 