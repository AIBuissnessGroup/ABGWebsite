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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Hero Section', href: '/admin/hero', icon: SparklesIcon },
  { name: 'About Section', href: '/admin/about', icon: InformationCircleIcon },
  { name: 'Join Section', href: '/admin/join', icon: HandRaisedIcon },
  { name: 'Team Members', href: '/admin/team', icon: UserGroupIcon },
  { name: 'Projects', href: '/admin/projects', icon: RocketLaunchIcon },
  { name: 'Events', href: '/admin/events', icon: CalendarIcon },
  { name: 'Companies', href: '/admin/companies', icon: BuildingOfficeIcon },
  { name: 'Forms', href: '/admin/forms', icon: DocumentTextIcon },
  { name: 'Site Settings', href: '/admin/settings', icon: CogIcon },
  { name: 'Internships', href: '/admin/internships', icon: BriefcaseIcon },
  { name: 'Changelog', href: '/admin/changelog', icon: ClockIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-48 md:w-64 bg-[#00274c] text-white h-full flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="p-3 md:p-6 border-b border-white/10">
        <h1 className="text-lg md:text-xl font-bold text-white">ABG Admin</h1>
        <p className="text-xs md:text-sm text-[#BBBBBB] mt-1 hidden sm:block">Content Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 md:px-4 py-4 md:py-6 space-y-1 md:space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white border-l-4 border-[#BBBBBB]'
                  : 'text-[#BBBBBB] hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="text-sm md:text-base truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 md:p-4 border-t border-white/10">
        <p className="text-xs text-[#5e6472] text-center md:text-left">
          © 2025 ABG
        </p>
      </div>
    </div>
  );
} 