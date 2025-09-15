'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
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

  // Don't render until client-side to avoid hydration mismatch
  if (!isLoaded) {
    return (
      <div className={`countdown-timer ${className}`}>
        <div className="flex gap-4 justify-center">
          {['Days', 'Hours', 'Minutes', 'Seconds'].map((unit) => (
            <div key={unit} className="text-center">
              <div className="bg-[#00274c]/90 backdrop-blur-sm text-white rounded-lg p-3 min-w-16 border border-[#00274c]/50 shadow-lg">
                <div className="text-2xl font-bold text-white">--</div>
              </div>
              <div className="text-sm mt-1 text-white drop-shadow-lg font-medium">{unit}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="text-center">
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-lg inline-block shadow-lg">
          🎉 Event has started!
        </div>
      </div>
    );
  }

  return (
    <div className={`countdown-timer ${className}`}>
      <div className="flex gap-4 justify-center flex-wrap">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="bg-[#00274c]/90 backdrop-blur-sm text-white rounded-lg p-3 min-w-16 border border-[#00274c]/50 hover:bg-[#00274c] transition-all duration-300 shadow-lg">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {value.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-sm mt-1 text-white drop-shadow-lg capitalize font-medium">
              {unit}
            </div>
          </div>
        ))}
      </div>
    
    </div>
  );
}