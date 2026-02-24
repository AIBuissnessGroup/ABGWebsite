'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

function PanelTitleContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const panelNumber = searchParams.get('panel') || '1';
  const panelTitle = searchParams.get('title') || 'The AI Transformation';
  const panelDescription = searchParams.get('description') || 'How students, founders, and operators are building in the age of AI';
  const panelTime = searchParams.get('time') || '11:00 – 11:50 AM CT';
  
  // Animation states
  const [phase, setPhase] = useState(0);
  // Phase 0: Background with floating shapes only
  // Phase 1: Countdown "3"
  // Phase 2: Countdown "2"
  // Phase 3: Countdown "1"
  // Phase 4: Show "LIVE" badge
  // Phase 5: Show panel number
  // Phase 6: Show title
  // Phase 7: Show divider
  // Phase 8: Show description
  // Phase 9: Show time
  // Phase 10: Hold for viewing
  // Phase 11: Zoom in and fade out to transparent
  
  useEffect(() => {
    const timings = [
      1000,  // Phase 0 -> 1: Just background with shapes for 1s
      700,   // Phase 1 -> 2: "3"
      700,   // Phase 2 -> 3: "2"
      700,   // Phase 3 -> 4: "1"
      800,   // Phase 4 -> 5: "LIVE" badge
      500,   // Phase 5 -> 6: Panel number visible
      500,   // Phase 6 -> 7: Title visible
      300,   // Phase 7 -> 8: Divider visible
      400,   // Phase 8 -> 9: Description visible
      300,   // Phase 9 -> 10: Time visible
      3000,  // Phase 10 -> 11: Hold for 3 seconds
      500,   // Phase 11 -> done: Quick zoom-in fade out
    ];
    
    let timeout: NodeJS.Timeout;
    
    if (phase < timings.length) {
      timeout = setTimeout(() => {
        setPhase(p => p + 1);
      }, timings[phase]);
    }
    
    return () => clearTimeout(timeout);
  }, [phase]);

  // Everything fades out at phase 11 with zoom effect
  const fadeOut = phase >= 11;
  
  // Content visibility based on phase
  const countdownNum = phase >= 1 && phase <= 3 ? (4 - phase).toString() : null;
  const showLive = phase >= 4 && phase < 5;
  const showPanelNum = phase >= 5;
  const showTitle = phase >= 6;
  const showDivider = phase >= 7;
  const showDescription = phase >= 8;
  const showTime = phase >= 9;

  return (
    <div 
      className={`w-screen h-screen overflow-hidden relative transition-all duration-500 ${fadeOut ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
      style={{ 
        background: `linear-gradient(135deg, #0B1C2D 0%, #081624 50%, #0d1f35 100%)`
      }}
    >
      {/* Floating shapes background - always visible until fade out */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#bf5a36]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-[#00274c]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[60%] w-48 h-48 rounded-full bg-[#bf5a36]/5 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[30%] w-72 h-72 rounded-full bg-[#00274c]/10 blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[40%] left-[20%] w-56 h-56 rounded-full bg-[#bf5a36]/8 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
        {/* Countdown numbers - 3, 2, 1 */}
        <div 
          className={`absolute transition-all duration-300 ${
            countdownNum ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
          }`}
        >
          <span className="text-[180px] font-bold text-white/90 tabular-nums"
            style={{ 
              textShadow: '0 0 60px rgba(191, 90, 54, 0.5)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {countdownNum}
          </span>
        </div>
        
        {/* LIVE badge */}
        <div 
          className={`absolute transition-all duration-500 ${
            showLive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="flex items-center gap-4 bg-red-600/90 px-8 py-4 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
            <span className="text-white text-5xl font-bold tracking-wider">LIVE</span>
          </div>
        </div>
        
        {/* Main content - fades in sequentially starting phase 5 */}
        <div className={`flex flex-col items-center ${phase < 5 ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <p 
            className={`text-[#bf5a36] text-xl font-semibold uppercase tracking-widest mb-6 transition-all duration-500 ${
              showPanelNum ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            PANEL {panelNumber}
          </p>
          
          <h1 
            className={`text-6xl md:text-8xl font-bold text-white mb-6 transition-all duration-500 ${
              showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {panelTitle}
          </h1>
          
          {/* Divider */}
          <div 
            className={`w-48 h-1 bg-[#bf5a36] my-8 transition-all duration-500 ${
              showDivider ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
          />
          
          <p 
            className={`text-white/70 text-2xl max-w-3xl mb-8 transition-all duration-500 ${
              showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {panelDescription}
          </p>
          
          <p 
            className={`text-white/50 text-xl transition-all duration-500 ${
              showTime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {panelTime}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PanelTitleOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#0B1C2D]" />}>
      <PanelTitleContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- panel: Panel number (default: "1")
- title: Panel title (default: "The AI Transformation")
- description: Panel description
- time: Panel time slot

Example:
/sxsw/overlay/panel-title?panel=2&title=Student%20Builders&time=12:00%20PM

Animation sequence:
1. Background with floating shapes (1 second)
2. Countdown: 3... 2... 1... (each ~0.7s)
3. "LIVE" badge with pulsing dot
4. Elements fade in one at a time (panel number, title, divider, description, time)
5. Holds for 3 seconds
6. Quick zoom-in effect as screen fades to transparent (revealing live video)
*/
