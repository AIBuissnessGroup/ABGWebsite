import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useEventCountdown = (eventDate: string, endDate?: string) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const startTime = new Date(eventDate).getTime();
      const endTime = endDate ? new Date(endDate).getTime() : startTime + (2 * 60 * 60 * 1000); // Default 2 hours if no endDate
      
      // Check if event is currently live
      if (now >= startTime && now <= endTime) {
        setIsLive(true);
        setIsEnded(false);
        return;
      }
      
      // Check if event has ended
      if (now > endTime) {
        setIsEnded(true);
        setIsLive(false);
        return;
      }
      
      // Event hasn't started yet, calculate countdown
      setIsLive(false);
      setIsEnded(false);
      
      const difference = startTime - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, endDate]);

  return { timeLeft, isLive, isEnded };
};