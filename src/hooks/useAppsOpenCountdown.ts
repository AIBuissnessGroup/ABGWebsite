'use client';
import { useState, useEffect } from 'react';

export interface AppsOpenCountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOpen: boolean;
  formattedString: string;
  openDate: Date;
}

// Thursday January 16, 2026 at 7:40 PM EST
const APPS_OPEN_DATE = new Date('2026-01-16T19:40:00-05:00');

export function useAppsOpenCountdown(): AppsOpenCountdownData {
  const [countdown, setCountdown] = useState<AppsOpenCountdownData>(() => {
    return calculateCountdown();
  });

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(calculateCountdown());
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return countdown;
}

function calculateCountdown(): AppsOpenCountdownData {
  const now = new Date();
  const timeDiff = APPS_OPEN_DATE.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOpen: true,
      formattedString: 'Applications Open!',
      openDate: APPS_OPEN_DATE
    };
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  // Format string
  let formattedString = '';
  if (days >= 1) {
    formattedString = `${days}d ${hours}h ${minutes}m`;
  } else if (hours >= 1) {
    formattedString = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    formattedString = `${minutes}m ${seconds}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isOpen: false,
    formattedString,
    openDate: APPS_OPEN_DATE
  };
}
