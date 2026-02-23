'use client';

import { useState, useEffect } from 'react';

interface SXSWCountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function SXSWCountdown({ targetDate }: SXSWCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
        setIsExpired(false);
      } else {
        setIsExpired(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Set up interval
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="text-center">
        <p className="text-white/60 text-sm sm:text-base mb-4">Livestream begins in</p>
        <div className="flex gap-2 sm:gap-4 justify-center">
          {['Days', 'Hours', 'Minutes', 'Seconds'].map((unit) => (
            <div key={unit} className="sxsw-countdown-box">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">--</div>
              <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide mt-1">{unit}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30">
          <span className="w-2 h-2 bg-red-500 rounded-full live-indicator" />
          <span className="text-red-400 font-semibold text-sm sm:text-base">Event is happening now!</span>
        </div>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' },
  ];

  return (
    <div className="text-center">
      <p className="text-white/60 text-sm sm:text-base mb-4">Livestream begins in</p>
      <div className="flex gap-2 sm:gap-4 justify-center">
        {units.map(({ value, label }) => (
          <div key={label} className="sxsw-countdown-box">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white tabular-nums">
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
