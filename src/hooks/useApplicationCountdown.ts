'use client';
import { useState, useEffect } from 'react';

export interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  isEndingSoon: boolean; // Less than 48 hours
  formattedString: string;
  deadline: Date;
}

export function useApplicationCountdown(deadlineString?: string): CountdownData {
  // Get deadline from environment variable or use default
  const envDeadline = process.env.NEXT_PUBLIC_APPLICATION_DEADLINE;
  const defaultDeadline = new Date('2025-10-15T23:59:59-04:00'); // Eastern Time fallback
  
  // Memoize the deadline to prevent recreating the Date object on every render
  const deadline = deadlineString 
    ? new Date(deadlineString)
    : envDeadline 
    ? new Date(envDeadline)
    : defaultDeadline;
    
  const deadlineTime = deadline.getTime(); // Convert to timestamp to use as dependency
  
  const [countdown, setCountdown] = useState<CountdownData>(() => {
    return calculateCountdown(deadline);
  });

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(calculateCountdown(deadline));
    };

    // Update immediately
    updateCountdown();

    // Update every second when page is visible, every 30 seconds when backgrounded
    let interval: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (interval) clearInterval(interval);
      
      if (document.hidden) {
        // Page is backgrounded, update every 30 seconds
        interval = setInterval(updateCountdown, 30000);
      } else {
        // Page is visible, update every second
        interval = setInterval(updateCountdown, 1000);
      }
    };

    // Set up initial interval
    handleVisibilityChange();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [deadlineTime]); // Use timestamp as dependency instead of Date object

  return countdown;
}

function calculateCountdown(deadline: Date): CountdownData {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      isEndingSoon: false,
      formattedString: 'Applications Closed',
      deadline
    };
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  // Check if ending soon (less than 48 hours)
  const isEndingSoon = timeDiff < (48 * 60 * 60 * 1000);

  // Format string - show days only if >= 1 day
  let formattedString = '';
  if (days >= 1) {
    formattedString = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  } else {
    formattedString = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isEnded: false,
    isEndingSoon,
    formattedString,
    deadline
  };
}

// Helper function to format the deadline for ARIA labels
export function formatDeadlineForAria(deadline: Date): string {
  return deadline.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}