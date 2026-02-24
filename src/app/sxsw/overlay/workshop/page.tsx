'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

function AIWorkshopContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const workshopTitle = searchParams.get('title') || 'AI in Action Workshop';
  const workshopSubtitle = searchParams.get('subtitle') || 'Hands-on with cutting-edge AI tools';
  const instructorName = searchParams.get('instructor') || 'ABG Tech Committee';
  const workshopTime = searchParams.get('time') || '2:00 – 3:30 PM CT';
  const workshopTopic = searchParams.get('topic') || 'Building with LLMs';
  
  // Animation states
  const [phase, setPhase] = useState(0);
  // Phase 0: Background with floating shapes
  // Phase 1: Gear icon animates in
  // Phase 2: "WORKSHOP" badge
  // Phase 3: Title appears
  // Phase 4: Subtitle
  // Phase 5: Divider
  // Phase 6: Instructor info
  // Phase 7: Time
  // Phase 8: Hold
  // Phase 9: Zoom out and fade
  
  useEffect(() => {
    const timings = [
      800,   // Phase 0 -> 1: Background
      600,   // Phase 1 -> 2: Gear icon
      500,   // Phase 2 -> 3: Workshop badge
      500,   // Phase 3 -> 4: Title
      400,   // Phase 4 -> 5: Subtitle
      300,   // Phase 5 -> 6: Divider
      400,   // Phase 6 -> 7: Instructor
      300,   // Phase 7 -> 8: Time
      3500,  // Phase 8 -> 9: Hold
      500,   // Phase 9 -> done: Fade out
    ];
    
    let timeout: NodeJS.Timeout;
    
    if (phase < timings.length) {
      timeout = setTimeout(() => {
        setPhase(p => p + 1);
      }, timings[phase]);
    }
    
    return () => clearTimeout(timeout);
  }, [phase]);

  const fadeOut = phase >= 9;
  
  const showGear = phase >= 1;
  const showBadge = phase >= 2;
  const showTitle = phase >= 3;
  const showSubtitle = phase >= 4;
  const showDivider = phase >= 5;
  const showInstructor = phase >= 6;
  const showTime = phase >= 7;

  return (
    <div 
      className={`w-screen h-screen overflow-hidden relative transition-all duration-500 ${fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      style={{ 
        background: `linear-gradient(135deg, #0B1C2D 0%, #081624 50%, #0d1f35 100%)`
      }}
    >
      {/* Floating shapes background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#bf5a36]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-[#00274c]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[60%] w-48 h-48 rounded-full bg-[#bf5a36]/5 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-72 h-72 rounded-full bg-[#00274c]/10 blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
        {/* Gear Icon */}
        <div 
          className={`mb-6 transition-all duration-700 ${
            showGear ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'
          }`}
        >
          <svg 
            className="w-20 h-20 text-[#bf5a36]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ filter: 'drop-shadow(0 0 20px rgba(191, 90, 54, 0.4))' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        {/* Workshop Badge */}
        <div 
          className={`mb-6 transition-all duration-500 ${
            showBadge ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="bg-[#bf5a36] text-white text-sm font-bold uppercase tracking-widest px-6 py-2 rounded-full">
            Interactive Workshop
          </span>
        </div>
        
        {/* Title */}
        <h1 
          className={`text-6xl md:text-7xl font-bold text-white mb-4 transition-all duration-500 ${
            showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {workshopTitle}
        </h1>
        
        {/* Subtitle */}
        <p 
          className={`text-white/70 text-2xl mb-4 transition-all duration-500 ${
            showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {workshopSubtitle}
        </p>
        
        {/* Topic badge */}
        <div 
          className={`mb-8 transition-all duration-500 ${
            showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <span className="bg-white/10 text-white/80 text-base px-4 py-1.5 rounded-lg border border-white/20">
            {workshopTopic}
          </span>
        </div>
        
        {/* Divider */}
        <div 
          className={`w-48 h-1 bg-[#bf5a36] mb-8 transition-all duration-500 ${
            showDivider ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />
        
        {/* Instructor */}
        <p 
          className={`text-white/60 text-xl mb-2 transition-all duration-500 ${
            showInstructor ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Led by <span className="text-white font-semibold">{instructorName}</span>
        </p>
        
        {/* Time */}
        <p 
          className={`text-white/40 text-lg transition-all duration-500 ${
            showTime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {workshopTime}
        </p>
      </div>
    </div>
  );
}

export default function AIWorkshopOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#0B1C2D]" />}>
      <AIWorkshopContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- title: Workshop title (default: "AI in Action Workshop")
- subtitle: Workshop subtitle (default: "Hands-on with cutting-edge AI tools")
- instructor: Instructor name (default: "ABG Tech Committee")
- time: Workshop time (default: "2:00 – 3:30 PM CT")
- topic: Workshop topic badge (default: "Building with LLMs")

Example:
/sxsw/overlay/workshop?title=Prompt%20Engineering%20101&instructor=John%20Smith&topic=ChatGPT%20%26%20Claude

Animation sequence:
1. Background with floating shapes
2. Gear icon spins in
3. "INTERACTIVE WORKSHOP" badge
4. Title fades in
5. Subtitle and topic badge
6. Orange divider line
7. Instructor info
8. Time
9. Holds for 3.5 seconds
10. Fades out
*/
