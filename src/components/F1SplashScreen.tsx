'use client';
import { useState, useEffect, useRef } from 'react';

// Step progression:
// 0 = waiting (API call in progress)
// 1 = light 1 on  → "3"
// 2 = light 2 on  → "2"
// 3 = light 3 on  → "1"
// 4 = all green   → "GO!"
// 5 = button visible

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

export default function F1SplashScreen() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Don't show again in the same session
    if (typeof window !== 'undefined' && sessionStorage.getItem('f1_splash_shown')) {
      return;
    }

    fetch('/api/theme')
      .then((r) => r.json())
      .then((data) => {
        // Only show if explicitly enabled in the DB
        if (data.f1_2026_fall === true) {
          setShow(true);

          const schedule = (fn: () => void, ms: number) => {
            const t = setTimeout(fn, ms);
            timersRef.current.push(t);
          };

          schedule(() => setStep(1), 800);
          schedule(() => setStep(2), 1800);
          schedule(() => setStep(3), 2800);
          schedule(() => setStep(4), 3800);
          schedule(() => setStep(5), 4800);
        }
      })
      .catch(() => {});

    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem('f1_splash_shown', 'true');
    setExiting(true);
    setTimeout(() => setShow(false), 600);
  };

  if (!show) return null;

  const countdownLabel =
    step === 1 ? '3'
    : step === 2 ? '2'
    : step === 3 ? '1'
    : step >= 4 ? 'GO!'
    : '';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden
        transition-opacity duration-600
        ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}
      style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #2e2e2e 50%, #1a1a1a 100%)' }}
    >
      {/* Animated track lines background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="f1-splash-track-lines" />
      </div>

      {/* Checkered corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 f1-checker-corner" />
      <div className="absolute top-0 right-0 w-24 h-24 f1-checker-corner scale-x-[-1]" />
      <div className="absolute bottom-0 left-0 w-24 h-24 f1-checker-corner scale-y-[-1]" />
      <div className="absolute bottom-0 right-0 w-24 h-24 f1-checker-corner scale-[-1]" />

      {/* Red accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff1801] to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff1801] to-transparent opacity-80" />

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
        <div className="flex flex-col items-center gap-3">
          {/* Gantry bar */}
          <div className="relative w-72 flex items-center justify-center">
            <div className="absolute inset-0 h-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 rounded-full" />
            {/* Gantry posts */}
            <div className="absolute left-4 top-1/2 w-3 h-20 bg-gray-600 rounded -translate-y-1/2" />
            <div className="absolute right-4 top-1/2 w-3 h-20 bg-gray-600 rounded -translate-y-1/2" />

            {/* Light housing */}
            <div className="relative z-10 flex items-center justify-center gap-5 bg-gray-900 border-2 border-gray-600 rounded-2xl px-8 py-5 shadow-2xl">
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

        {/* Enter button */}
        {step >= 5 && (
          <button
            onClick={handleEnter}
            className="animate-f1-pop group relative px-10 py-4 bg-[#ff1801] hover:bg-[#cc1400] text-white font-black text-lg rounded-full
              shadow-[0_0_30px_rgba(255,24,1,0.5)] hover:shadow-[0_0_50px_rgba(255,24,1,0.8)]
              transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Take me to the website!</span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="f1-btn-shimmer" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
