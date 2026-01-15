'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ClockIcon,
  SparklesIcon,
  InformationCircleIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  BellIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  SnowflakeIcon,
} from '@heroicons/react/24/outline';

// Snowflake icon component (Heroicons doesn't have one)
const SnowflakeIconCustom = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3m-3 15l-3-3m3 3l3-3M3 12h18m-18 0l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3" />
  </svg>
);

const navigationSections = [
  {
    name: '🔝 Priority',
    key: 'priority',
    items: [
      { name: '❄️ Winter Takeover', href: '/admin/winter-takeover', icon: SnowflakeIconCustom, anthonyOnly: true },
      { name: 'Recruitment Portal', href: '/admin/recruitment-portal', icon: AcademicCapIcon },
      { name: 'Events', href: '/admin/events', icon: CalendarIcon },
      { name: 'Forms', href: '/admin/forms', icon: DocumentTextIcon },
      { name: 'Projects', href: '/admin/projects', icon: RocketLaunchIcon },
      { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
    ],
  },
  {
    name: '🎯 Recruitment',
    key: 'recruitment',
    items: [
      { name: 'Coffee Chats', href: '/admin/coffee-chats', icon: ClockIcon },
      { name: 'Interviews', href: '/admin/interviews', icon: UserGroupIcon },
      { name: 'Form Analytics', href: '/admin/analytics/forms', icon: ChartBarIcon },
      { name: 'Recruitment Page', href: '/admin/recruitment', icon: CalendarIcon },
    ],
  },
  {
    name: '📰 Content & People',
    key: 'content',
    items: [
      { name: 'Newsroom', href: '/admin/newsroom', icon: SparklesIcon },
      { name: 'Team Members', href: '/admin/team', icon: UserGroupIcon },
      { name: 'Users', href: '/admin/users', icon: CogIcon },
      { name: 'Companies', href: '/admin/companies', icon: BuildingOfficeIcon },
      { name: 'Internships', href: '/admin/internships', icon: BriefcaseIcon },
    ],
  },
  {
    name: '⚙️ Site Management',
    key: 'site',
    items: [
      { name: 'Dashboard', href: '/admin', icon: HomeIcon },
      { name: 'Hero Section', href: '/admin/hero', icon: SparklesIcon },
      { name: 'About Section', href: '/admin/about', icon: InformationCircleIcon },
      { name: 'Join Section', href: '/admin/join', icon: HandRaisedIcon },
      { name: 'Newsletter', href: '/admin/newsletter', icon: EnvelopeIcon },
    ],
  },
  {
    name: '🔧 System',
    key: 'system',
    items: [
      { name: 'Audit Log', href: '/admin/audit', icon: ChartBarIcon },
      { name: 'Site Settings', href: '/admin/settings', icon: CogIcon },
      { name: 'Changelog', href: '/admin/changelog', icon: ClockIcon },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['priority']);
  
  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved) setCollapsed(saved === 'true');
    
    const savedSections = localStorage.getItem('adminSidebarSections');
    if (savedSections) setExpandedSections(JSON.parse(savedSections));
  }, []);
  
  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', String(collapsed));
  }, [collapsed]);
  
  useEffect(() => {
    localStorage.setItem('adminSidebarSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };
  
  const expandAll = () => {
    setExpandedSections(navigationSections.map(s => s.key));
  };
  
  const collapseAll = () => {
    setExpandedSections([]);
  };

  // Check if current page is in a section
  const isInSection = (section: typeof navigationSections[0]) => {
    return section.items.some(item => pathname === item.href);
  };

  return (
    <div 
      className={`${collapsed ? 'w-16' : 'w-48 md:w-64'} bg-[#00274c] text-white h-full flex flex-col border-r border-gray-200 transition-all duration-300`} 
      style={{backgroundColor: '#00274c', color: 'white'}}
    >
      {/* Header with collapse button */}
      <div className="p-3 md:p-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{color: 'white'}}>ABG Admin</h1>
            <p className="text-xs mt-1 hidden sm:block text-white/60">Content Management</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Bars3Icon className="w-5 h-5 text-white" />
          ) : (
            <XMarkIcon className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Expand/Collapse All buttons */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-white/10 flex gap-2">
          <button
            onClick={expandAll}
            className="flex-1 text-xs py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 text-xs py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Navigation - with scrollbar */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navigationSections.map((section) => {
          const isExpanded = expandedSections.includes(section.key);
          const hasActivePage = isInSection(section);
          
          return (
            <div key={section.key} className="mb-2">
              {/* Section Header */}
              {!collapsed ? (
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    hasActivePage ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-semibold text-white/80 truncate">
                    {section.name}
                  </span>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-white/60 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-white/60 flex-shrink-0" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-white/10 my-2" />
              )}
              
              {/* Section Items */}
              {(isExpanded || collapsed) && (
                <div className={`${collapsed ? '' : 'ml-2 mt-1'} space-y-0.5`}>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-white/20 border-l-4 border-yellow-400'
                            : 'hover:bg-white/5'
                        } ${collapsed ? 'justify-center' : ''}`}
                        style={{color: 'white', textDecoration: 'none'}}
                        title={collapsed ? item.name : undefined}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" style={{color: 'white'}} />
                        {!collapsed && (
                          <span className="truncate text-sm" style={{color: 'white'}}>{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 md:p-4 border-t border-white/10 flex-shrink-0">
        {!collapsed && (
          <p className="text-center md:text-left" style={{color: 'white', fontSize: '0.75rem'}}>
            © 2025 ABG
          </p>
        )}
      </div>
    </div>
  );
} 