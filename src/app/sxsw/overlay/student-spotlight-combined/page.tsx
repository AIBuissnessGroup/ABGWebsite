'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

function StudentSpotlightCombinedContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters
  const studentName = searchParams.get('name') || 'Alex Rodriguez';
  const studentMajor = searchParams.get('major') || 'Computer Science, Class of 2027';
  const studentSchool = searchParams.get('school') || 'University of Michigan';
  const studentRole = searchParams.get('role') || 'Project Lead, AI Business Group';
  const studentImage = searchParams.get('image') || '';
  const studentBio = searchParams.get('bio') || 'Building the future of AI at SXSW 2026';
  const introDuration = parseInt(searchParams.get('intro') || '6') * 1000; // seconds for intro
  const autoHide = searchParams.get('autoHide'); // seconds before lower-third hides
  
  // Simplified phases:
  // 0: Intro - full screen with student card
  // 1: Transition to video mode
  // 2: Video mode - transparent with lower-third only
  // 3: (optional) Hide lower-third
  const [phase, setPhase] = useState(0);
  const [introAnimStep, setIntroAnimStep] = useState(0);
  
  useEffect(() => {
    // Intro animation steps (quick, lightweight)
    if (phase === 0) {
      const steps = [300, 400, 400, introDuration - 1100]; // title, card, hold
      let step = 0;
      const runStep = () => {
        if (step < steps.length) {
          setTimeout(() => {
            setIntroAnimStep(s => s + 1);
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
      // Transition to video mode
      const timeout = setTimeout(() => setPhase(2), 600);
      return () => clearTimeout(timeout);
    }
  }, [phase]);
  
  useEffect(() => {
    if (phase === 2 && autoHide) {
      const timeout = setTimeout(() => setPhase(3), parseInt(autoHide) * 1000);
      return () => clearTimeout(timeout);
    }
  }, [phase, autoHide]);

  const isIntro = phase === 0;
  const isTransitioning = phase === 1;
  const isVideoMode = phase >= 2;
  const isHidden = phase >= 3;

  // Intro mode - full screen
  if (isIntro || isTransitioning) {
    return (
      <div 
        className={`w-screen h-screen overflow-hidden relative transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          background: `linear-gradient(135deg, #0B1C2D 0%, #081624 50%, #0d1f35 100%)`
        }}
      >
        {/* Simple accent glow - no blur */}
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#bf5a36]/8" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-[#00274c]/15" />
        
        {/* Main content */}
        <div className="relative h-full flex items-center justify-center p-12">
          {/* Title - left side */}
          <div 
            className={`absolute right-[52%] top-1/2 -translate-y-1/2 text-right transition-all duration-500 ${
              introAnimStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <p className="text-[#bf5a36] text-lg font-semibold uppercase tracking-widest mb-4">
              AI Business Group @ SXSW
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              STUDENT
            </h1>
            <h1 className="text-5xl md:text-6xl font-bold text-[#bf5a36]">
              SPOTLIGHT
            </h1>
          </div>
          
          {/* Divider */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 transition-all duration-400 ${
              introAnimStep >= 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-px h-48 bg-gradient-to-b from-transparent via-[#bf5a36]/60 to-transparent" />
          </div>
          
          {/* Student Card - right side */}
          <div 
            className={`absolute left-[52%] top-1/2 -translate-y-1/2 transition-all duration-500 ${
              introAnimStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20 flex items-center gap-8 max-w-xl">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-28 h-28 rounded-full border-4 border-[#bf5a36] overflow-hidden bg-[#0B1C2D]">
                  {studentImage ? (
                    <Image 
                      src={studentImage}
                      alt={studentName}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl text-white/60">
                        {studentName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Student Info */}
              <div className="text-left">
                <p className="text-white text-2xl font-bold mb-2">{studentName}</p>
                <p className="text-[#bf5a36] text-lg font-medium mb-2">{studentRole}</p>
                <p className="text-white/70 text-base mb-1">{studentMajor}</p>
                <p className="text-white/50 text-sm mb-3">{studentSchool}</p>
                <div className="w-12 h-0.5 bg-[#bf5a36]/50 mb-3" />
                <p className="text-white/60 text-sm italic max-w-xs">{studentBio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video mode - transparent with lower-third
  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Lower third card - bottom left */}
      <div 
        className={`absolute bottom-12 left-12 transition-all duration-500 ${
          isHidden ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="bg-[#0B1C2D]/90 rounded-xl p-5 border border-white/10 flex items-center gap-5 shadow-xl">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full border-2 border-[#bf5a36] overflow-hidden bg-[#0B1C2D]">
              {studentImage ? (
                <Image 
                  src={studentImage}
                  alt={studentName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xl text-white/60 font-semibold">
                    {studentName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-12 bg-[#bf5a36]/50" />
          
          {/* Student Info */}
          <div className="text-left">
            <p className="text-[#bf5a36] text-xs font-semibold uppercase tracking-widest mb-0.5">Student Spotlight</p>
            <p className="text-white text-lg font-bold mb-0.5">{studentName}</p>
            <p className="text-white/70 text-sm">{studentRole}</p>
            <p className="text-white/50 text-xs">{studentMajor}</p>
          </div>
        </div>
      </div>
      
      {/* ABG branding - bottom right */}
      <div 
        className={`absolute bottom-12 right-12 transition-all duration-500 ${
          isHidden ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="bg-white/10 rounded-lg px-4 py-2 border border-white/10">
          <p className="text-white/60 text-xs uppercase tracking-wider">AI Business Group</p>
          <p className="text-[#bf5a36] text-sm font-semibold">@ SXSW 2026</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentSpotlightCombined() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <StudentSpotlightCombinedContent />
    </Suspense>
  );
}

/*
COMBINED: Student Spotlight Intro + Video Overlay

Lightweight version optimized for vMix - minimal CPU/memory usage.

URL Parameters:
- name: Student name
- major: Major and class year
- school: School name
- role: ABG role
- image: Profile image URL (optional)
- bio: Short bio/quote
- intro: Seconds for intro screen (default: 6)
- autoHide: Seconds to show lower-third before hiding (optional)

Flow:
1. Intro screen with student info (6 seconds default)
2. Fade transition
3. Transparent overlay with lower-third (layer video in vMix underneath)
4. (Optional) Auto-hide lower-third

Example:
/sxsw/overlay/student-spotlight-combined?name=Jane%20Smith&role=VP%20Events&intro=5&autoHide=30
*/
