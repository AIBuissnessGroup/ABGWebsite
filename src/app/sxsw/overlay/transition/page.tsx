'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OverlayWrapper, AUSTIN_COLOR } from '../components';

function TransitionContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const line1 = searchParams.get('line1') || 'AI SHAPES';
  const line2 = searchParams.get('line2') || 'BUSINESS.';
  const accent = searchParams.get('accent') || 'WE BUILD AI SOLUTIONS';
  const tagline = searchParams.get('tagline') || 'Redefining what it means to be career ready in an AI driven world.';
  const slogan = searchParams.get('slogan') || 'HAIL TO THE INNOVATORS';

  return (
    <OverlayWrapper>
      <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
        {/* Animated line indicator */}
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        {/* Primary Slogan */}
        <div className="space-y-2 mb-8">
          <p className="text-5xl md:text-6xl font-bold text-white tracking-wide">{line1}</p>
          <p className="text-5xl md:text-6xl font-bold text-white tracking-wide">{line2}</p>
          <p className="text-3xl md:text-4xl font-semibold text-[#bf5a36] tracking-wide mt-4">{accent}</p>
        </div>
        
        {/* Secondary */}
        <p className="text-white/50 text-lg max-w-xl mb-10">
          {tagline}
        </p>
        
        <div className="w-20 h-px bg-white/20 mb-8" />
        
        {/* Brand Close */}
        <div className="text-center">
          <p className="text-white/80 text-xl font-semibold mb-2">AI Business Group</p>
          <p className="text-white/40 text-sm uppercase tracking-wide mb-3">Proudly Affiliated With Ross & Engineering</p>
          <p className="text-[#bf5a36] text-2xl tracking-wide font-medium">{slogan}</p>
        </div>
      </div>
    </OverlayWrapper>
  );
}

export default function TransitionOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#0B1C2D]" />}>
      <TransitionContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- line1: First line of slogan (default: "AI SHAPES")
- line2: Second line of slogan (default: "BUSINESS.")
- accent: Accent text in orange (default: "WE BUILD AI SOLUTIONS")
- tagline: Secondary tagline text
- slogan: Bottom slogan (default: "HAIL TO THE INNOVATORS")

Example:
/sxsw/overlay/transition?slogan=GO%20BLUE
*/
