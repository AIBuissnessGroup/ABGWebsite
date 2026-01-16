'use client';

import { ReactNode, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

interface HostLayoutProps {
  children: ReactNode;
}

export default function HostLayout({ children }: HostLayoutProps) {
  // Add host-page class to body for proper text color styling
  useEffect(() => {
    document.body.classList.add('host-page');
    return () => {
      document.body.classList.remove('host-page');
    };
  }, []);

  return (
    <SessionProvider>
      <Toaster position="top-right" />
      {children}
    </SessionProvider>
  );
}
