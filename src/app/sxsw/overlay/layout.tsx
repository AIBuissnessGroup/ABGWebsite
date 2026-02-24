'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Overlay layout - minimal wrapper for vMix browser inputs
export default function OverlayLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isControlPanel = pathname?.includes('/control');
  
  return (
    <div className="overlay-container">
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          ${isControlPanel ? '' : 'overflow: hidden;'}
        }
      `}</style>
      {children}
    </div>
  );
}
