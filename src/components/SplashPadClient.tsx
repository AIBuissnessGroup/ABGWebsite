'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Step progression:
// 0 = waiting
// 1 = light 1 on  → "3"
// 2 = light 2 on  → "2"
// 3 = light 3 on  → "1"
// 4 = all green   → "GO!"

function StopLight({ lit, go }: { lit: boolean; go: boolean }) {
  return (
    <div
      className={`
        w-16 h-16 rounded-full border-4 border-gray-600 transition-all duration-300 shadow-lg
        ${go
          ? 'bg-green-400 border-green-300 shadow-green-400/80 shadow-[0_0_30px_8px]'
          : lit
          ? 'bg-red-600 border-red-400 shadow-red-500/80 shadow-[0_0_30px_8px]'
          : 'bg-gray-800 border-gray-600'
        }
      `}
    />
  );
}

export default function SplashPadClient() {
  const [step, setStep] = useState(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const startSequence = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setStep(0);

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
    };

    schedule(() => setStep(1), 800);
    schedule(() => setStep(2), 1800);
    schedule(() => setStep(3), 2800);
    schedule(() => setStep(4), 3800);
  };

  useEffect(() => {
    startSequence();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        startSequence();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      timersRef.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const countdownLabel =
    step === 1 ? '3'
    : step === 2 ? '2'
    : step === 3 ? '1'
    : step >= 4 ? 'GO!'
    : '';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #2e2e2e 50%, #1a1a1a 100%)' }}
    >
      {/* Animated track lines background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="f1-splash-track-lines" />
      </div>

      {/* Checkered corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 f1-checker-corner pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 f1-checker-corner scale-x-[-1] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 f1-checker-corner scale-y-[-1] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 f1-checker-corner scale-[-1] pointer-events-none" />

      {/* Red accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff1801] to-transparent opacity-80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff1801] to-transparent opacity-80 pointer-events-none" />

      {/* Subtle back home link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="text-white/40 hover:text-white/90 transition-colors text-xs flex items-center gap-1.5 font-medium tracking-wide uppercase px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm"
        >
          <span>←</span>
          <span>Home</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">

        {/* Headline */}
        <div className="space-y-2">
          <p className="text-[#ff1801] text-sm font-bold uppercase tracking-[0.3em]">
            AIBG Recruitment 2026
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            Ready for AIBG
            <br />
            <span className="text-[#ff1801]">Recruitment?</span>
          </h1>
        </div>

        {/* Stoplight gantry */}
        <div
          onClick={startSequence}
          className="flex flex-col items-center gap-3 cursor-pointer group"
          title="Click to restart countdown"
        >
          {/* Gantry bar */}
          <div className="relative w-72 flex items-center justify-center">
            <div className="absolute inset-0 h-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 rounded-full" />
            {/* Gantry posts */}
            <div className="absolute left-4 top-1/2 w-3 h-20 bg-gray-600 rounded -translate-y-1/2" />
            <div className="absolute right-4 top-1/2 w-3 h-20 bg-gray-600 rounded -translate-y-1/2" />

            {/* Light housing */}
            <div className="relative z-10 flex items-center justify-center gap-5 bg-gray-900 border-2 border-gray-600 rounded-2xl px-8 py-5 shadow-2xl group-hover:border-gray-400 transition-colors">
              <StopLight lit={step >= 1} go={step >= 4} />
              <StopLight lit={step >= 2} go={step >= 4} />
              <StopLight lit={step >= 3} go={step >= 4} />
            </div>
          </div>

          {/* Gantry legs */}
          <div className="flex gap-[218px]">
            <div className="w-3 h-8 bg-gray-600 rounded" />
            <div className="w-3 h-8 bg-gray-600 rounded" />
          </div>
        </div>

        {/* Countdown number */}
        <div className="h-24 flex items-center justify-center">
          {countdownLabel && (
            <span
              key={countdownLabel}
              className={`
                font-black tabular-nums animate-f1-pop
                ${step >= 4
                  ? 'text-green-400 text-8xl drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]'
                  : 'text-white text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                }
              `}
            >
              {countdownLabel}
            </span>
          )}
        </div>

        {/* Restart control when complete (removed 'Take me to the website' button) */}
        {step >= 4 && (
          <div className="animate-f1-pop flex flex-col items-center gap-2 pt-2">
            <button
              onClick={startSequence}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 hover:text-white rounded-full text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Restart Countdown</span>
            </button>
            <span className="text-white/30 text-xs">or press Space / R</span>
          </div>
        )}
      </div>
    </div>
  );
}
