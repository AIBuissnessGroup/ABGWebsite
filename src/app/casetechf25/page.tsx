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
        src="https://159.89.33.25:5602/kibana/"
        sandbox="allow-same-origin allow-scripts allow-forms"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="Case Tech F25 Dashboard"
        allowFullScreen
      />
    </div>
  );
}