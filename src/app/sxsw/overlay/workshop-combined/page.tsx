'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { ABGLogoBox } from '../components';

function WorkshopCombinedContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters
  const workshopTitle = searchParams.get('title') || 'AI in Action Workshop';
  const workshopSubtitle = searchParams.get('subtitle') || 'Hands-on with cutting-edge AI tools';
  const instructorName = searchParams.get('instructor') || 'ABG Tech Committee';
  const workshopTime = searchParams.get('time') || '2:00 – 3:30 PM CT';
  const workshopTopic = searchParams.get('topic') || 'Building with LLMs';
  const presenterName = searchParams.get('presenter') || instructorName;
  const presenterRole = searchParams.get('role') || 'AI Developer, ABG';
  const statusText = searchParams.get('status') || 'Real-time AI build in progress...';
  const toolName = searchParams.get('tool') || 'Code Editor / AI Tool';
  const showStatus = searchParams.get('showStatus') !== 'false';
  const introDuration = parseInt(searchParams.get('intro') || '5') * 1000;
  
  // Phases:
  // 0: Intro screen with workshop info
  // 1: Transition
  // 2: Live overlay mode (transparent)
  const [phase, setPhase] = useState(0);
  const [introStep, setIntroStep] = useState(0);
  
  useEffect(() => {
    if (phase === 0) {
      // Quick intro animation steps
      const steps = [200, 300, 300, 300, introDuration - 1100];
      let step = 0;
      const runStep = () => {
        if (step < steps.length) {
          setTimeout(() => {
            setIntroStep(s => s + 1);
            step++;
            runStep();
          }, steps[step]);
        } else {
          setPhase(1);
        }
      };
      runStep();
    }
  }, [phase, introDuration]);
  
  useEffect(() => {
    if (phase === 1) {
      const timeout = setTimeout(() => setPhase(2), 500);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  const isIntro = phase === 0;
  const isTransitioning = phase === 1;
  const isLiveMode = phase >= 2;

  // Intro mode
  if (isIntro || isTransitioning) {
    return (
      <div 
        className={`w-screen h-screen overflow-hidden relative transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          background: `linear-gradient(135deg, #0B1C2D 0%, #081624 50%, #0d1f35 100%)`
        }}
      >
        {/* Simple accent shapes - no blur for performance */}
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#bf5a36]/8" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-[#00274c]/15" />
        <div className="absolute top-[20%] right-[15%] w-56 h-56 rounded-full bg-[#00274c]/10" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
          {/* Gear Icon */}
          <div 
            className={`mb-5 transition-all duration-500 ${
              introStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <svg 
              className="w-16 h-16 text-[#bf5a36]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          {/* Workshop Badge */}
          <div 
            className={`mb-5 transition-all duration-400 ${
              introStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="bg-[#bf5a36] text-white text-sm font-bold uppercase tracking-widest px-5 py-2 rounded-full">
              Interactive Workshop
            </span>
          </div>
          
          {/* Title */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-white mb-3 transition-all duration-400 ${
              introStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {workshopTitle}
          </h1>
          
          {/* Subtitle */}
          <p 
            className={`text-white/70 text-xl mb-3 transition-all duration-400 ${
              introStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {workshopSubtitle}
          </p>
          
          {/* Topic badge */}
          <div 
            className={`mb-6 transition-all duration-400 ${
              introStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="bg-white/10 text-white/80 text-base px-4 py-1.5 rounded-lg border border-white/20">
              {workshopTopic}
            </span>
          </div>
          
          {/* Divider */}
          <div 
            className={`w-40 h-1 bg-[#bf5a36] mb-6 transition-all duration-400 ${
              introStep >= 3 ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Instructor & Time */}
          <div 
            className={`transition-all duration-400 ${
              introStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-white/60 text-lg mb-1">
              Led by <span className="text-white font-semibold">{instructorName}</span>
            </p>
            <p className="text-white/40 text-base">{workshopTime}</p>
          </div>
        </div>
      </div>
    );
  }

  // Live overlay mode - fully transparent background with minimal overlay elements
  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Top Left - Workshop Title Bar */}
      <div className="absolute top-6 left-6 flex items-start gap-3">
        <div className="bg-[#0B1C2D]/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg flex items-center gap-3">
          <div className="w-1 h-8 bg-[#bf5a36] rounded-full" />
          <div>
            <p className="text-[#bf5a36] text-xs font-semibold uppercase tracking-widest">Workshop</p>
            <p className="text-white text-sm font-semibold max-w-md">{workshopTitle}</p>
          </div>
        </div>
      </div>
      
      {/* Bottom Left - Presenter Info */}
      <div className="absolute bottom-6 left-6">
        <div className="bg-[#0B1C2D]/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg">
          <p className="text-[#bf5a36] text-xs font-semibold uppercase tracking-wider mb-1">Presenter</p>
          <p className="text-white text-sm font-semibold">{presenterName}</p>
          <p className="text-white/70 text-xs">{presenterRole}</p>
        </div>
      </div>
      
      {/* Bottom Right - ABG Branding */}
      <div className="absolute bottom-6 right-6">
        <ABGLogoBox size="small" />
      </div>
    </div>
  );
}

export default function WorkshopCombined() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <WorkshopCombinedContent />
    </Suspense>
  );
}

/*
COMBINED: Workshop Intro + Live Overlay

Lightweight version optimized for vMix - minimal CPU/memory usage.

URL Parameters:
- title: Workshop title
- subtitle: Workshop subtitle
- instructor: Instructor name (used in intro)
- time: Workshop time slot
- topic: Topic badge text
- presenter: Presenter name (live mode, defaults to instructor)
- role: Presenter role (live mode)
- status: Status text below screen share
- tool: Tool name shown in placeholder
- showStatus: Show center placeholder (default: true)
- intro: Seconds for intro screen (default: 5)

Flow:
1. Intro screen with gear icon, title, instructor (5 seconds default)
2. Fade transition
3. Transparent live overlay with presenter info

Example:
/sxsw/overlay/workshop-combined?title=Prompt%20Engineering%20101&instructor=John%20Smith&intro=4
*/
