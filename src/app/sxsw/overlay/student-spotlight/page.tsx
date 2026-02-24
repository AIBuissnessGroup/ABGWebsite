'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Image from 'next/image';

function StudentSpotlightContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const studentName = searchParams.get('name') || 'Alex Rodriguez';
  const studentMajor = searchParams.get('major') || 'Computer Science, Class of 2027';
  const studentSchool = searchParams.get('school') || 'University of Michigan';
  const studentRole = searchParams.get('role') || 'Project Lead, AI Business Group';
  const studentImage = searchParams.get('image') || '';
  const studentBio = searchParams.get('bio') || 'Building the future of AI at SXSW 2026';
  
  // Animation phases
  const [phase, setPhase] = useState(0);
  // Phase 0: Dark with spotlight searching (2s)
  // Phase 1: Spotlight finds title, holds center (1s)
  // Phase 2: Background reveals (0.8s)
  // Phase 3: Title moves to left side (0.6s)
  // Phase 4: Student card slides in (0.5s)
  // Phase 5: Hold for viewing
  // Phase 6: Zoom out and fade
  
  useEffect(() => {
    const timings = [
      2000,  // Phase 0 -> 1: Spotlight searching
      1000,  // Phase 1 -> 2: Spotlight found title
      800,   // Phase 2 -> 3: Background reveals
      600,   // Phase 3 -> 4: Title moves left
      500,   // Phase 4 -> 5: Card slides in
      4000,  // Phase 5 -> 6: Hold
      600,   // Phase 6 -> done: Fade out
    ];
    
    let timeout: NodeJS.Timeout;
    
    if (phase < timings.length) {
      timeout = setTimeout(() => {
        setPhase(p => p + 1);
      }, timings[phase]);
    }
    
    return () => clearTimeout(timeout);
  }, [phase]);
  
  // Spotlight position with smooth animation
  // Initial position matches where sine waves start at t=0
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 73 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [spotlightReady, setSpotlightReady] = useState(false);
  
  // Fade in spotlight after brief delay to prevent blink
  useEffect(() => {
    const timeout = setTimeout(() => setSpotlightReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);
  
  useEffect(() => {
    if (phase === 0) {
      // Smooth spotlight wandering using requestAnimationFrame
      let animationId: number;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        // Create a smooth wandering motion using sine waves
        const x = 50 + Math.sin(elapsed * 0.7) * 25 + Math.sin(elapsed * 1.2) * 12;
        const y = 45 + Math.cos(elapsed * 0.5) * 18 + Math.cos(elapsed * 0.9) * 10;
        setSpotlightPos({ x, y });
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    } else if (phase === 1) {
      // Smoothly transition to center - CSS handles the animation
      setIsAnimating(false);
      // Small delay then move to center
      const timeout = setTimeout(() => {
        setSpotlightPos({ x: 50, y: 45 });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  const fadeOut = phase >= 6;
  const spotlightFound = phase >= 1;
  const revealBackground = phase >= 2;
  const titleMoved = phase >= 3;
  const showCard = phase >= 4;

  return (
    <div 
      className={`w-screen h-screen overflow-hidden relative transition-all duration-500 ${fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      style={{ 
        background: '#000000'
      }}
    >
      {/* Curtain/stage background - dark red/burgundy like theater curtain */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, #1a0a0a 0%, #0d0505 50%, #000000 100%)`
        }}
      />
      
      {/* Dark overlay - everything is dark */}
      <div 
        className={`absolute inset-0 pointer-events-none z-10 bg-black ${revealBackground ? 'opacity-0' : 'opacity-95'}`}
        style={{
          transition: 'opacity 1s ease-out'
        }}
      />
      
      {/* Single theater spotlight - crisp circle with soft edge */}
      <div 
        className={`absolute pointer-events-none z-20`}
        style={{
          left: `${spotlightPos.x}%`,
          top: `${spotlightPos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '380px',
          height: '380px',
          background: `radial-gradient(circle at center, 
            rgba(255,252,248,0.45) 0%, 
            rgba(255,252,248,0.4) 60%,
            rgba(255,252,248,0.3) 75%,
            rgba(255,252,248,0.12) 88%,
            rgba(255,252,248,0.03) 95%,
            transparent 100%
          )`,
          borderRadius: '50%',
          opacity: !spotlightReady ? 0 : (revealBackground ? 0 : 1),
          transition: isAnimating 
            ? 'opacity 0.3s ease-out' 
            : 'left 0.8s ease-out, top 0.8s ease-out, opacity 1s ease-out',
          mixBlendMode: 'lighten'
        }}
      />
      
      {/* Floating shapes background - visible after reveal */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${revealBackground ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: `linear-gradient(135deg, #0B1C2D 0%, #081624 50%, #0d1f35 100%)` }}
      >
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#bf5a36]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-[#00274c]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[60%] w-48 h-48 rounded-full bg-[#bf5a36]/5 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Main content */}
      <div className="relative h-full flex items-center justify-center p-12 z-20">
        {/* Student Spotlight Title - ALWAYS present, just barely visible until spotlight hits */}
        <div 
          className={`absolute transition-all duration-700 ease-out ${
            titleMoved 
              ? 'left-[28%] top-1/2 -translate-y-1/2 text-left' 
              : 'left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center'
          }`}
          style={{
            opacity: revealBackground ? 1 : (spotlightFound ? 1 : 0.03)
          }}
        >
          <p className={`text-[#bf5a36] text-lg font-semibold uppercase tracking-widest mb-4 transition-opacity duration-500 ${titleMoved ? 'opacity-100' : 'opacity-0'}`}>
            AI Business Group @ SXSW
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white whitespace-nowrap">
            STUDENT
          </h1>
          <h1 className="text-5xl md:text-6xl font-bold text-[#bf5a36] whitespace-nowrap">
            SPOTLIGHT
          </h1>
        </div>
        
        {/* Vertical Divider Line - appears when card shows */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
            showCard 
              ? 'opacity-100 scale-y-100' 
              : 'opacity-0 scale-y-0'
          }`}
        >
          <div className="w-px h-48 bg-gradient-to-b from-transparent via-[#bf5a36]/60 to-transparent" />
        </div>
        
        {/* Student Card - slides in from right */}
        <div 
          className={`absolute left-[54%] top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
            showCard 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-20'
          }`}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 flex items-center gap-8 max-w-xl">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-[#bf5a36] overflow-hidden bg-[#0B1C2D]">
                {studentImage ? (
                  <Image 
                    src={studentImage}
                    alt={studentName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-white/60">
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

export default function StudentSpotlightOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#0B1C2D]" />}>
      <StudentSpotlightContent />
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
- bio: Short bio/quote (default: "Building the future of AI at SXSW 2026")

Example:
/sxsw/overlay/student-spotlight?name=Jane%20Smith&major=Business%20Admin,%20Class%20of%202026&role=VP%20Events&image=/images/jane.jpg

Animation sequence:
1. Dark stage with text barely visible (3% opacity) - theater spotlight wanders searching (2s)
2. Spotlight smoothly finds and illuminates "STUDENT SPOTLIGHT" title in center (1s)  
3. Background reveals with floating shapes (0.8s)
4. Title moves from center to left side (0.6s)
5. Student card slides in from right (0.5s)
6. Holds for 4 seconds
7. Zooms out and fades to transparent
*/
