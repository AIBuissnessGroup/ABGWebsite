'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

function TransitionContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters
  const holdTime = parseInt(searchParams.get('hold') || '2000');
  
  // Animation phases:
  // 0: Nothing visible
  // 1: Circle expands from center
  // 2: Hold - shapes rotate, text visible
  // 3: Circle contracts back to center
  const [phase, setPhase] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  
  useEffect(() => {
    const expandTime = 500;
    
    const timer1 = setTimeout(() => setPhase(1), 50);
    const timer2 = setTimeout(() => {
      setPhase(2);
      setTimeout(() => setTextVisible(true), 200);
    }, expandTime + 50);
    const timer3 = setTimeout(() => {
      setTextVisible(false);
      setTimeout(() => setPhase(3), 250);
    }, expandTime + holdTime + 50);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [holdTime]);
  
  // Rotation animation during hold
  useEffect(() => {
    if (phase === 2) {
      const interval = setInterval(() => {
        setRotation(prev => prev + 0.5);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Scale for the main circle
  const getCircleScale = () => {
    if (phase === 0) return 0;
    if (phase === 1 || phase === 2) return 1;
    if (phase === 3) return 0;
    return 0;
  };

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      {/* Main expanding circle */}
      <div 
        className="absolute w-[200vmax] h-[200vmax] rounded-full"
        style={{
          background: 'radial-gradient(circle, #0B1C2D 0%, #00274c 50%, #081624 100%)',
          transform: `scale(${getCircleScale()})`,
          transition: phase === 3 
            ? 'transform 400ms cubic-bezier(0.4, 0, 1, 1)' 
            : 'transform 500ms cubic-bezier(0, 0, 0.2, 1)'
        }}
      >
        {/* Inner rotating ring */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] rounded-full border border-[#bf5a36]/20"
          style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
        >
          {/* Orbiting dots */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#bf5a36]/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-white/30" />
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#bf5a36]/40" />
          <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/20" />
        </div>
        
        {/* Second rotating ring - opposite direction */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] rounded-full border border-white/10"
          style={{ transform: `translate(-50%, -50%) rotate(${-rotation * 0.7}deg)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-[#bf5a36]/50" />
        </div>
        
        {/* Static decorative shapes */}
        <div 
          className="absolute top-1/2 left-1/2 w-[90vh] h-[90vh]"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          {/* Corner triangles */}
          <div 
            className="absolute top-[10%] left-[20%] opacity-15"
            style={{
              width: 0,
              height: 0,
              borderLeft: '30px solid transparent',
              borderRight: '30px solid transparent',
              borderBottom: '50px solid #bf5a36',
              transform: `rotate(${rotation * 0.3}deg)`
            }}
          />
          <div 
            className="absolute bottom-[15%] right-[25%] opacity-10"
            style={{
              width: 0,
              height: 0,
              borderLeft: '25px solid transparent',
              borderRight: '25px solid transparent',
              borderBottom: '40px solid white',
              transform: `rotate(${-rotation * 0.4}deg)`
            }}
          />
          
          {/* Floating squares */}
          <div 
            className="absolute top-[25%] right-[15%] w-8 h-8 border border-[#bf5a36]/30"
            style={{ transform: `rotate(${45 + rotation * 0.5}deg)` }}
          />
          <div 
            className="absolute bottom-[30%] left-[18%] w-6 h-6 bg-white/5"
            style={{ transform: `rotate(${rotation * 0.4}deg)` }}
          />
          
          {/* Circles */}
          <div className="absolute top-[35%] left-[12%] w-16 h-16 rounded-full bg-[#bf5a36]/10" />
          <div className="absolute bottom-[20%] right-[10%] w-12 h-12 rounded-full border border-white/10" />
        </div>
      </div>
      
      {/* Center content */}
      <div className="relative z-10 text-center">
        {/* Decorative circle behind text */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-[#bf5a36]/30"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${textVisible ? 1 : 0.5})`,
            transition: 'all 400ms ease-out'
          }}
        />
        
        {/* Main title */}
        <h1 
          className="text-4xl md:text-5xl font-bold text-white tracking-wide mb-3 relative"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          AI Business Group
        </h1>
        
        {/* Decorative line */}
        <div 
          className="w-24 h-1 bg-gradient-to-r from-transparent via-[#bf5a36] to-transparent mx-auto mb-3"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'all 400ms ease-out 100ms'
          }}
        />
        
        {/* Slogan */}
        <p 
          className="text-[#bf5a36] text-xl md:text-2xl font-semibold tracking-widest uppercase mb-2"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 400ms ease-out 150ms'
          }}
        >
          Hail to the Innovators
        </p>
        
        {/* Subtitle */}
        <p 
          className="text-white/60 text-sm tracking-wider"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 400ms ease-out 250ms'
          }}
        >
          University of Michigan @ SXSW 2026
        </p>
      </div>
    </div>
  );
}

export default function TransitionOverlay2() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <TransitionContent />
    </Suspense>
  );
}

/*
STINGER TRANSITION 2 - Circular Burst

A circle expands from center, holds with rotating orbital rings,
then contracts back to nothing.

Animation:
1. Circle expands from center point
2. Hold: rings rotate, text scales in with spring
3. Text fades, circle contracts back to center

URL Parameters:
- hold: Time to hold in ms (default: 2000)

Total timing: ~500ms expand + hold + ~250ms fade + ~400ms contract

Example:
/sxsw/overlay/transition-2?hold=2500
*/
