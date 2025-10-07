'use client';
import { useState, useEffect } from 'react';
import { 
  HomeIcon,
  InformationCircleIcon,
  HandRaisedIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  BriefcaseIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  CalendarIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import AnalyticsWidget from '@/components/admin/AnalyticsWidget';

interface AuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta: any;
  ip?: string;
  userAgent?: string;
  timestamp: string;
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
          const data = await response.json();
          // Handle both old format (array) and new format (object with logs property)
          const logs = Array.isArray(data) ? data : (data.logs || []);
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
    switch (resource?.toLowerCase()) {
      case 'user': return '👤';
      case 'event': return '📅';
      case 'project': return '🚀';
      case 'team': return '👥';
      case 'teammember': return '👤';
      case 'newsroompost': return '📰';
      case 'form': return '📝';
      case 'content': return '�';
      case 'hero': return '🏠';
      case 'about': return 'ℹ️';
      case 'join': return '🤝';
      case 'sitesettings': return '⚙️';
      case 'system': return '�️';
      default: return '📄';
    }
  };

  const quickActions = [
    {
      title: 'Hero Section',
      description: 'Edit homepage hero content',
      icon: SparklesIcon,
      color: 'bg-blue-500',
      href: '/admin/hero',
    },
    {
      title: 'About Section',
      description: 'Update about page content',
      icon: InformationCircleIcon,
      color: 'bg-green-500',
      href: '/admin/about',
    },
    {
      title: 'Join Section',
      description: 'Edit join options and contact info',
      icon: HandRaisedIcon,
      color: 'bg-purple-500',
      href: '/admin/join',
    },
    {
      title: 'Team Members',
      description: 'Manage team member profiles',
      icon: UserGroupIcon,
      color: 'bg-pink-500',
      href: '/admin/team',
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: UserGroupIcon,
      color: 'bg-red-500',
      href: '/admin/users',
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and user actions',
      icon: EyeIcon,
      color: 'bg-yellow-500',
      href: '/admin/audit',
    },
    {
      title: 'Projects',
      description: 'Add and manage projects',
      icon: RocketLaunchIcon,
      color: 'bg-orange-500',
      href: '/admin/projects',
    },
    {
      title: 'Events',
      description: 'Schedule and manage events',
      icon: CalendarIcon,
      color: 'bg-indigo-500',
      href: '/admin/events',
    },
    {
      title: 'Companies',
      description: 'Manage partner companies',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-600',
      href: '/admin/companies',
    },
    {
      title: 'Forms',
      description: 'Create and manage forms',
      icon: DocumentTextIcon,
      color: 'bg-emerald-500',
      href: '/admin/forms',
    },
    {
      title: 'Form Analytics',
      description: 'Analyze form responses',
      icon: ChartBarIcon,
      color: 'bg-teal-500',
      href: '/admin/analytics/forms',
    },
    {
      title: 'Newsletter',
      description: 'View email subscribers',
      icon: EnvelopeIcon,
      color: 'bg-cyan-500',
      href: '/admin/newsletter',
    },
    {
      title: 'Newsroom',
      description: 'Manage blog posts and content',
      icon: DocumentTextIcon,
      color: 'bg-slate-500',
      href: '/admin/newsroom',
    },
    {
      title: 'Internships',
      description: 'Manage internship program',
      icon: BriefcaseIcon,
      color: 'bg-amber-500',
      href: '/admin/internships',
    },
    {
      title: 'Site Settings',
      description: 'Configure site metadata',
      icon: CogIcon,
      color: 'bg-gray-500',
      href: '/admin/settings',
    },
    {
      title: 'Changelog',
      description: 'View recent changes',
      icon: ClockIcon,
      color: 'bg-slate-500',
      href: '/admin/changelog',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage ABG website content and monitor activity.</p>
        </div>
        <div className="flex gap-3">
          <a href="/" target="_blank" className="btn-primary flex items-center gap-2">
            <EyeIcon className="w-4 h-4" />
            View Website
          </a>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Admin Quick Links</h2>
          <p className="text-sm text-gray-600 mt-1">Access all admin sections directly from here</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all group hover:shadow-md"
              >
                <div className={`p-4 rounded-lg ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-tight">{action.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Widget */}
      <AnalyticsWidget />

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
                <div key={log._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getResourceIcon(log.targetType)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{log.targetType}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.meta?.reason || log.meta?.description || `Modified ${log.targetType.toLowerCase()}`}
                        {log.targetId && ` (ID: ${log.targetId})`}
                      </p>
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


    </div>
  );
} 