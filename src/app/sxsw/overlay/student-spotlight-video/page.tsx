'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Image from 'next/image';

function StudentSpotlightVideoContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const studentName = searchParams.get('name') || 'Alex Rodriguez';
  const studentMajor = searchParams.get('major') || 'Computer Science, Class of 2027';
  const studentSchool = searchParams.get('school') || 'University of Michigan';
  const studentRole = searchParams.get('role') || 'Project Lead, AI Business Group';
  const studentImage = searchParams.get('image') || '';
  
  // Animation phases
  const [phase, setPhase] = useState(0);
  // Phase 0: Fade in lower third
  // Phase 1: Hold
  // Phase 2: Fade out (when video ends)
  
  useEffect(() => {
    const timings = [
      500,   // Phase 0 -> 1: Fade in
      // Phase 1 stays indefinitely - use URL param autoHide to auto-fade
    ];
    
    const autoHide = searchParams.get('autoHide');
    if (autoHide && phase === 1) {
      const hideTime = parseInt(autoHide) * 1000;
      const timeout = setTimeout(() => setPhase(2), hideTime);
      return () => clearTimeout(timeout);
    }
    
    if (phase < timings.length) {
      const timeout = setTimeout(() => setPhase(p => p + 1), timings[phase]);
      return () => clearTimeout(timeout);
    }
  }, [phase, searchParams]);

  const isVisible = phase >= 1 && phase < 2;
  const fadeOut = phase >= 2;

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Lower third card - bottom left */}
      <div 
        className={`absolute bottom-12 left-12 transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : fadeOut ? 'opacity-0 translate-y-4' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="bg-[#0B1C2D]/90 backdrop-blur-md rounded-xl p-6 border border-white/10 flex items-center gap-6 shadow-2xl">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-3 border-[#bf5a36] overflow-hidden bg-[#0B1C2D]">
              {studentImage ? (
                <Image 
                  src={studentImage}
                  alt={studentName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl text-white/60 font-semibold">
                    {studentName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#bf5a36]/50 to-transparent" />
          
          {/* Student Info */}
          <div className="text-left">
            <p className="text-[#bf5a36] text-xs font-semibold uppercase tracking-widest mb-1">Student Spotlight</p>
            <p className="text-white text-xl font-bold mb-1">{studentName}</p>
            <p className="text-white/70 text-sm">{studentRole}</p>
            <p className="text-white/50 text-xs">{studentMajor} • {studentSchool}</p>
          </div>
        </div>
      </div>
      
      {/* ABG branding - bottom right */}
      <div 
        className={`absolute bottom-12 right-12 transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : fadeOut ? 'opacity-0 translate-y-4' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '100ms' }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
          <p className="text-white/60 text-xs uppercase tracking-wider">AI Business Group</p>
          <p className="text-[#bf5a36] text-sm font-semibold">@ SXSW 2026</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentSpotlightVideoOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <StudentSpotlightVideoContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- name: Student name (default: "Alex Rodriguez")
- major: Major and class year (default: "Computer Science, Class of 2027")
- school: School name (default: "University of Michigan")
- role: ABG role (default: "Project Lead, AI Business Group")
- image: Profile image URL (optional - shows initials if not provided)
- autoHide: Number of seconds to show before auto-fading (optional)

Example:
/sxsw/overlay/student-spotlight-video?name=Jane%20Smith&role=VP%20Events&autoHide=30

This is a TRANSPARENT overlay to be placed over a pre-recorded student spotlight video.
Shows a lower-third identifying the student with their info.
*/
