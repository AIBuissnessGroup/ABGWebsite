'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  FolderIcon,
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
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const navigation = [
  // 🔝 Priority Operations
  { name: 'Events', href: '/admin/events', icon: CalendarIcon },
  { name: 'Forms', href: '/admin/forms', icon: DocumentTextIcon },
  { name: 'Coffee Chats', href: '/admin/coffee-chats', icon: ClockIcon },
  { name: 'Interviews', href: '/admin/interviews', icon: UserGroupIcon },
  { name: 'Form Analytics', href: '/admin/analytics/forms', icon: ChartBarIcon },
  { name: 'Projects', href: '/admin/projects', icon: RocketLaunchIcon },

  // 📰 Content & People
  { name: 'Newsroom', href: '/admin/newsroom', icon: SparklesIcon },
  { name: 'Team Members', href: '/admin/team', icon: UserGroupIcon },
  { name: 'Users', href: '/admin/users', icon: CogIcon },
  { name: 'Companies', href: '/admin/companies', icon: BuildingOfficeIcon },
  { name: 'Internships', href: '/admin/internships', icon: BriefcaseIcon },

  // ⚙️ System & Site Management
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Hero Section', href: '/admin/hero', icon: SparklesIcon },
  { name: 'About Section', href: '/admin/about', icon: InformationCircleIcon },
  { name: 'Join Section', href: '/admin/join', icon: HandRaisedIcon },
  { name: 'Newsletter', href: '/admin/newsletter', icon: EnvelopeIcon },
  { name: 'Recruitment', href: '/admin/recruitment', icon: CalendarIcon },
  { name: 'Audit Log', href: '/admin/audit', icon: ChartBarIcon },
  { name: 'Site Settings', href: '/admin/settings', icon: CogIcon },
  { name: 'Changelog', href: '/admin/changelog', icon: ClockIcon },
];



export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-48 md:w-64 bg-[#00274c] text-white h-full flex flex-col border-r border-gray-200" style={{backgroundColor: '#00274c', color: 'white'}}>
      {/* Logo */}
      <div className="p-3 md:p-6 border-b border-white/10 flex-shrink-0">
        <h1 className="text-lg md:text-xl font-bold" style={{color: 'white', fontSize: '1.125rem', fontWeight: 'bold'}}>ABG Admin</h1>
        <p className="text-xs md:text-sm mt-1 hidden sm:block" style={{color: 'white', fontSize: '0.75rem'}}>Content Management</p>
      </div>

      {/* Navigation - with scrollbar */}
      <nav className="flex-1 px-2 md:px-4 py-4 md:py-6 space-y-1 md:space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 border-l-4 border-white'
                  : 'hover:bg-white/5'
              }`}
              style={{color: 'white', textDecoration: 'none'}}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{color: 'white'}} />
              <span className="truncate" style={{color: 'white', fontSize: '0.875rem'}}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 md:p-4 border-t border-white/10 flex-shrink-0">
        <p className="text-center md:text-left" style={{color: 'white', fontSize: '0.75rem'}}>
          © 2025 ABG
        </p>
      </div>
    </div>
  );
} 