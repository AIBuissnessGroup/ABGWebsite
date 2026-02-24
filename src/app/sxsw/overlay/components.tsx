'use client';

import Image from 'next/image';
import FloatingShapes from '@/components/FloatingShapes';

// vMix overlay wrapper with optional transparent or styled background
export function OverlayWrapper({ 
  children, 
  transparent = false,
  showShapes = true 
}: { 
  children: React.ReactNode; 
  transparent?: boolean;
  showShapes?: boolean;
}) {
  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ 
        background: transparent 
          ? 'transparent' 
          : 'linear-gradient(135deg, #0d1f35 0%, #0a1628 50%, #0d1f35 100%)'
      }}
    >
      {/* Grainy texture */}
      {!transparent && (
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
          }}
        />
      )}
      
      {/* Floating Shapes */}
      {showShapes && !transparent && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingShapes />
        </div>
      )}
      
      {/* Content */}
      <div className="relative w-full h-full">
        {children}
      </div>
    </div>
  );
}

// ABG Logo Box component with affiliation logos image
export function ABGLogoBox({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) {
  const sizeClasses = {
    small: { imgWidth: 200, imgHeight: 20, label: 'text-[5px] px-2 py-0.5', box: 'px-0.5 py-0' },
    normal: { imgWidth: 260, imgHeight: 26, label: 'text-[6px] px-3 py-0.5', box: 'px-1 py-0' },
    large: { imgWidth: 320, imgHeight: 32, label: 'text-[8px] px-4 py-1', box: 'px-1.5 py-0.5' }
  };
  
  const s = sizeClasses[size];
  
  return (
    <div className="relative flex flex-col items-start">
      {/* Folder tab - positioned behind the main box, on the left */}
      <div className="relative z-10 bg-white/90 rounded-t-md -mb-[1px] ml-1">
        <p className={`${s.label} font-bold uppercase tracking-wider text-[#0B1C2D]/60`}>
          Proudly Affiliated With
        </p>
      </div>
      {/* Main logo box */}
      <div className={`relative z-20 bg-white rounded-lg ${s.box} shadow-lg`}>
        <Image 
          src="/slimLogos.png" 
          alt="Michigan Ross | Michigan Engineering | School of Information"
          width={s.imgWidth}
          height={s.imgHeight}
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>
    </div>
  );
}

// Austin accent color
export const AUSTIN_COLOR = '#bf5a36';
export const NAVY_COLOR = '#0B1C2D';
