'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OverlayWrapper, ABGLogoBox, AUSTIN_COLOR } from '../components';

function EndingContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const headline = searchParams.get('headline') || 'THANK YOU FOR JOINING US';
  const website = searchParams.get('website') || 'abgumich.org';
  const social = searchParams.get('social') || '@abgumich';

  return (
    <OverlayWrapper>
      <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
          {headline}
        </h1>
        
        {/* Divider */}
        <div className="w-32 h-px bg-white/20 my-8" />
        
        <p className="text-white/80 text-2xl mb-2">AI Business Group</p>
        <p className="text-white/60 text-lg mb-8">University of Michigan</p>
        
        <div className="space-y-2">
          <p className="text-[#bf5a36] text-xl font-medium">{website}</p>
          <p className="text-white/50 text-lg">{social}</p>
        </div>
        
        {/* ABG Logo Box */}
        <div className="absolute bottom-8 right-8">
          <ABGLogoBox size="large" />
        </div>
      </div>
    </OverlayWrapper>
  );
}

export default function EndingOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#0B1C2D]" />}>
      <EndingContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- headline: Main headline (default: "THANK YOU FOR JOINING US")
- website: Website URL (default: "abgumich.org")
- social: Social handle (default: "@abgumich")

Example:
/sxsw/overlay/ending?headline=SEE%20YOU%20NEXT%20YEAR
*/
