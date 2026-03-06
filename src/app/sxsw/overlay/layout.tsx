'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Overlay layout - minimal wrapper for vMix browser inputs
export default function OverlayLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isControlPanel = pathname?.includes('/control');
  
  // Check if this is a transparent overlay (not soft-opening, ending, transition, workshop intro, panel-title, student-spotlight)
  const transparentOverlays = ['/lower-third', '/student-spotlight-video', '/workshop-live'];
  const isTransparent = transparentOverlays.some(overlay => pathname?.includes(overlay));
  
  return (
    <div className="overlay-container" style={isTransparent ? { background: 'transparent' } : { background: '#0B1C2D' }}>
      <style jsx global>{`
        ${isTransparent ? `
          html, body {
            background: transparent !important;
            background-color: transparent !important;
          }
        ` : `
          /* Solid background immediately - no flash during reload */
          html, body {
            background: #0B1C2D !important;
            background-color: #0B1C2D !important;
          }
        `}
        body {
          margin: 0;
          padding: 0;
          ${isControlPanel ? '' : 'overflow: hidden;'}
        }
        ${isTransparent ? `
          /* vMix transparency support */
          .overlay-container {
            background: transparent !important;
          }
        ` : ''}
      `}</style>
      {children}
    </div>
  );
}
