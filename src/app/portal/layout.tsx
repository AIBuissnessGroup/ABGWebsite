'use client';

import { ReactNode, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Import portal-specific styles
import './portal.css';

interface PortalLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: '/portal', label: 'Dashboard', icon: HomeIcon },
  { href: '/portal/application', label: 'Application', icon: DocumentTextIcon },
  { href: '/portal/events', label: 'Events', icon: CalendarDaysIcon },
  { href: '/portal/schedule', label: 'Schedule', icon: ClockIcon },
];

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Add portal-page class to body for proper text color styling
  useEffect(() => {
    document.body.classList.add('portal-page');
    return () => {
      document.body.classList.remove('portal-page');
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="portal-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="portal-spinner mx-auto"></div>
          <p className="mt-2 portal-loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="portal-login">
        <div className="portal-login-card">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1>ABG Applicant Portal</h1>
          <p className="mb-6">
            Sign in with your University of Michigan email to access your application
          </p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/portal' })}
            className="portal-btn-primary w-full flex items-center justify-center gap-3 px-6 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
          <p className="mt-4 text-sm portal-text-muted">
            Only @umich.edu emails are accepted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container min-h-screen">
      {/* Top Header */}
      <header className="portal-header sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="text-xl portal-brand">ABG</span>
            <span className="text-sm portal-text-muted">Applicant Portal</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium portal-text-primary">{session.user?.name}</p>
              <p className="text-xs portal-text-muted">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 portal-btn-ghost"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <nav className="portal-nav flex gap-1 mb-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/portal' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`portal-nav-item flex items-center gap-2 ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
