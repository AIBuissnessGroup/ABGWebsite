'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

function TransitionContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters
  const holdTime = parseInt(searchParams.get('hold') || '2000'); // time to hold in ms
  
  // Animation phases:
  // 0: Panels off-screen (left/right)
  // 1: Panels slide in from left/right
  // 2: Hold - shapes float, text visible
  // 3: Panels slide out (up/down)
  const [phase, setPhase] = useState(0);
  const [shapeOffset, setShapeOffset] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  
  useEffect(() => {
    const slideTime = 400;
    
    const timer1 = setTimeout(() => setPhase(1), 50);
    const timer2 = setTimeout(() => {
      setPhase(2);
      // Stagger text appearance
      setTimeout(() => setTextVisible(true), 150);
    }, slideTime + 50);
    const timer3 = setTimeout(() => {
      setTextVisible(false); // Hide text first
      setTimeout(() => setPhase(3), 200); // Then panels leave
    }, slideTime + holdTime + 50);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [holdTime]);
  
  // Floating animation during hold
  useEffect(() => {
    if (phase === 2) {
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        setShapeOffset(Math.sin(frame * 0.05) * 10);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const slideTime = 400;

  // Left panel: comes from left, exits up
  const getLeftPanelTransform = () => {
    if (phase === 0) return 'translateX(-100%)';
    if (phase === 3) return 'translateY(-100%)';
    return 'translate(0%, 0%)';
  };
  
  // Right panel: comes from right, exits down
  const getRightPanelTransform = () => {
    if (phase === 0) return 'translateX(100%)';
    if (phase === 3) return 'translateY(100%)';
    return 'translate(0%, 0%)';
  };

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Left Panel - slides from LEFT, exits UP */}
      <div 
        className="absolute top-0 left-0 w-1/2 h-full"
        style={{
          transform: getLeftPanelTransform(),
          transition: `transform ${slideTime}ms cubic-bezier(0.4, 0, 0.2, 1)`
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-[#00274c] via-[#0B1C2D] to-[#081624] relative overflow-hidden">
          {/* Floating shapes - left side */}
          <div 
            className="absolute top-[15%] left-[20%] w-32 h-32 rounded-full bg-[#bf5a36]/15"
            style={{ transform: `translateY(${shapeOffset}px)` }}
          />
          <div 
            className="absolute top-[45%] left-[10%] w-20 h-20 rounded-full border-2 border-[#bf5a36]/30"
            style={{ transform: `translateY(${-shapeOffset * 0.7}px) rotate(${shapeOffset * 2}deg)` }}
          />
          <div 
            className="absolute bottom-[25%] left-[30%] w-16 h-16 bg-white/5 rotate-45"
            style={{ transform: `rotate(${45 + shapeOffset}deg)` }}
          />
          <div 
            className="absolute top-[70%] left-[15%] w-24 h-24 rounded-full bg-[#00274c]/40"
            style={{ transform: `translateY(${shapeOffset * 0.5}px)` }}
          />
          <div 
            className="absolute top-[30%] left-[50%] w-12 h-12 border border-white/10"
            style={{ transform: `rotate(${12 + shapeOffset * 1.5}deg)` }}
          />
          
          {/* Triangle */}
          <div 
            className="absolute top-[20%] right-[10%] opacity-20"
            style={{
              width: 0,
              height: 0,
              borderLeft: '40px solid transparent',
              borderRight: '40px solid transparent',
              borderBottom: '70px solid #bf5a36',
              transform: `translateY(${-shapeOffset * 0.8}px)`
            }}
          />
          <div 
            className="absolute bottom-[40%] left-[25%] opacity-10"
            style={{
              width: 0,
              height: 0,
              borderLeft: '25px solid transparent',
              borderRight: '25px solid transparent',
              borderBottom: '45px solid white',
              transform: `translateY(${shapeOffset * 0.6}px)`
            }}
          />
        </div>
      </div>
      
      {/* Right Panel - slides from RIGHT, exits DOWN */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full"
        style={{
          transform: getRightPanelTransform(),
          transition: `transform ${slideTime}ms cubic-bezier(0.4, 0, 0.2, 1) ${phase === 1 ? '60ms' : '0ms'}`
        }}
      >
        <div className="w-full h-full bg-gradient-to-bl from-[#00274c] via-[#0B1C2D] to-[#081624] relative overflow-hidden">
          {/* Floating shapes - right side */}
          <div 
            className="absolute top-[25%] right-[20%] w-28 h-28 rounded-full bg-[#bf5a36]/10"
            style={{ transform: `translateY(${-shapeOffset * 0.9}px)` }}
          />
          <div 
            className="absolute top-[55%] right-[15%] w-16 h-16 rounded-full border-2 border-white/10"
            style={{ transform: `translateY(${shapeOffset * 0.8}px) rotate(${-shapeOffset * 1.5}deg)` }}
          />
          <div 
            className="absolute bottom-[20%] right-[35%] w-20 h-20 bg-[#bf5a36]/8"
            style={{ transform: `rotate(${45 - shapeOffset}deg)` }}
          />
          <div 
            className="absolute top-[40%] right-[45%] w-10 h-10 rounded-full bg-white/5"
            style={{ transform: `translateY(${shapeOffset * 0.4}px)` }}
          />
          <div 
            className="absolute bottom-[35%] right-[12%] w-14 h-14 border border-[#bf5a36]/20"
            style={{ transform: `rotate(${45 + shapeOffset * 2}deg)` }}
          />
          
          {/* Triangles */}
          <div 
            className="absolute bottom-[25%] left-[15%] opacity-15 rotate-180"
            style={{
              width: 0,
              height: 0,
              borderLeft: '35px solid transparent',
              borderRight: '35px solid transparent',
              borderBottom: '60px solid #bf5a36',
              transform: `rotate(180deg) translateY(${shapeOffset * 0.7}px)`
            }}
          />
          <div 
            className="absolute top-[35%] right-[30%] opacity-10"
            style={{
              width: 0,
              height: 0,
              borderLeft: '20px solid transparent',
              borderRight: '20px solid transparent',
              borderBottom: '35px solid white',
              transform: `translateY(${-shapeOffset * 0.5}px)`
            }}
          />
        </div>
      </div>
      
      {/* Center divider line - glowing - fades out during text display */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full z-5"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #bf5a36 20%, #bf5a36 80%, transparent 100%)',
          opacity: phase >= 1 && phase <= 2 && !textVisible ? 0.6 : 0,
          boxShadow: phase === 2 && !textVisible ? '0 0 20px #bf5a36, 0 0 40px #bf5a36' : 'none',
          transition: 'opacity 300ms ease-out'
        }}
      />
      
      {/* Center Text - animated entrance/exit */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center"
      >
        {/* Main title */}
        <h1 
          className="text-4xl md:text-5xl font-bold text-white tracking-wide mb-3"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
            transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
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

export default function TransitionOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <TransitionContent />
    </Suspense>
  );
}

/*
STINGER TRANSITION - Horizontal in, Vertical out

Panels slide in from opposite sides (left/right), hold with floating shapes,
then exit in opposite vertical directions (up/down).

Animation:
1. Left panel slides in from left, right panel from right
2. Hold: shapes float, text staggers in with spring effect
3. Text fades out, then panels exit (left→up, right→down)

URL Parameters:
- hold: Time to hold at center in ms (default: 2000)

Total timing: ~400ms in + hold + ~200ms text fade + ~400ms out

Example:
/sxsw/overlay/transition?hold=2500
*/
