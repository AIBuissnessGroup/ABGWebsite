'use client';
import { SessionProvider } from 'next-auth/react';

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
    </SessionProvider>
  );
} 