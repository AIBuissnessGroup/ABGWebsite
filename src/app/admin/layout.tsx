'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import './admin.css';

// Mobile restriction component
function MobileRestriction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <div className="text-6xl mb-6">🖥️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Desktop Required
          </h1>
          <p className="text-white/80 mb-6 leading-relaxed">
            The admin dashboard is optimized for desktop use and requires a larger screen to function properly.
          </p>
          <p className="text-white/60 text-sm mb-6">
            Please access the admin panel from a tablet or desktop device with a screen width of at least 768px.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-6 py-3 text-white font-medium transition-all duration-300"
            >
              Return to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-white/70 hover:text-white text-sm underline"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);



  // Mobile detection
  useEffect(() => {
    setIsClient(true);
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Less than md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has admin role
    if (!session.user?.roles?.includes('ADMIN')) {
      router.push('/auth/unauthorized');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session || !session.user?.roles?.includes('ADMIN')) {
    return null;
  }

  // Show mobile restriction if on mobile device
  if (isClient && isMobile) {
    return <MobileRestriction />;
  }

  return (
    <div className="admin-page h-screen bg-gray-50 flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 