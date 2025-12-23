'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SessionProvider 
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'text-sm font-medium',
          success: {
            style: { background: '#ECFDF5', color: '#065F46' },
          },
          error: {
            style: { background: '#FEF2F2', color: '#991B1B' },
          },
        }}
      />
    </SessionProvider>
  );
}
