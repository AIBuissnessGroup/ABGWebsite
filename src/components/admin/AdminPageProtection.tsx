'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { canAccessAdminPage, hasAnyAdminAccess, getAccessDeniedMessage, AdminPage } from '@/lib/permissions';

/**
 * Higher-order component to protect admin pages with role-based access control
 */
export function withAdminPageProtection<P extends object>(
  Component: React.ComponentType<P>,
  page: AdminPage
) {
  return function ProtectedAdminPage(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (status === 'loading') return;

      // Not authenticated
      if (!session?.user) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check if user has any admin access
      if (!hasAnyAdminAccess(session.user.roles)) {
        router.push('/auth/unauthorized');
        return;
      }

      // Check page-specific permissions
      if (!canAccessAdminPage(session.user.roles, page)) {
        router.push(`/admin/access-denied?page=${page}`);
        return;
      }
    }, [session, status, router, pathname]);

    // Show loading state
    if (status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Not authenticated or no access
    if (!session?.user || !canAccessAdminPage(session.user.roles, page)) {
      return null;
    }

    // Render the protected component
    return <Component {...props} />;
  };
}

/**
 * Hook to check if current user can access a specific admin page
 */
export function useAdminPageAccess(page: AdminPage) {
  const { data: session } = useSession();
  
  if (!session?.user?.roles) {
    return false;
  }
  
  return canAccessAdminPage(session.user.roles, page);
}

/**
 * Hook to get all accessible admin pages for current user
 */
export function useAccessibleAdminPages() {
  const { data: session } = useSession();
  
  if (!session?.user?.roles) {
    return [];
  }
  
  return Object.keys(PAGE_PERMISSIONS).filter(page => 
    canAccessAdminPage(session.user.roles, page as AdminPage)
  ) as AdminPage[];
}
