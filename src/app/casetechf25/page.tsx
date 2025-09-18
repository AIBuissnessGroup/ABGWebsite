'use client';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function CaseTechF25Dashboard() {
  const { data: session, status } = useSession();

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      redirect('/auth/unauthorized');
    }
  }, [session, status]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#00274c] to-[#1a2c45]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!session || (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
              <iframe
          src="/api/kibana-proxy?path=/app/dashboards#/view/e1d4cc48-eac5-45a6-bd87-f286ddfcc76a?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A60000)%2Ctime%3A(from%3Anow-24h%2Fh%2Cto%3Anow))&hide-filter-bar=true"
          className="w-full h-full border-0"
          title="Case Tech F25 Dashboard"
          allowFullScreen
        />
    </div>
  );
}