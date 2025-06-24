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
  ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Site Content', href: '/admin/content', icon: DocumentTextIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#00274c] text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">ABG Admin</h1>
        <p className="text-sm text-[#BBBBBB] mt-1">Content Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white border-l-4 border-[#BBBBBB]'
                  : 'text-[#BBBBBB] hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-[#5e6472]">
          © 2025 AI Business Group
        </p>
      </div>
    </div>
  );
} 