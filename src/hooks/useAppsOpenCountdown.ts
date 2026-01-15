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
  isHydrated: boolean; // Track if we've hydrated on client
}

// Default fallback date if API fails
const DEFAULT_COUNTDOWN_DATE = new Date('2026-01-20T19:00:00-05:00');

// Cache the fetched date
let cachedCountdownDate: Date | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // Refetch every 30 seconds

async function fetchCountdownDate(): Promise<Date> {
  const now = Date.now();
  
  // Return cached date if still valid
  if (cachedCountdownDate && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedCountdownDate;
  }
  
  try {
    const res = await fetch('/api/admin/winter-takeover');
    const data = await res.json();
    
    if (data.countdownDate) {
      cachedCountdownDate = new Date(data.countdownDate);
      lastFetchTime = now;
      return cachedCountdownDate;
    }
  } catch (error) {
    console.error('Failed to fetch countdown date:', error);
  }
  
  // Return cached or default
  return cachedCountdownDate || DEFAULT_COUNTDOWN_DATE;
}

// Static initial state to prevent hydration mismatch
const INITIAL_STATE: AppsOpenCountdownData = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isOpen: false,
  formattedString: 'Loading...',
  openDate: new Date(),
  isHydrated: false,
};

export function useAppsOpenCountdown(): AppsOpenCountdownData {
  // Start with static state to avoid hydration mismatch
  const [countdown, setCountdown] = useState<AppsOpenCountdownData>(INITIAL_STATE);
  const [openDate, setOpenDate] = useState<Date | null>(null);

  // Fetch the countdown date on mount and periodically
  useEffect(() => {
    const loadDate = async () => {
      const date = await fetchCountdownDate();
      setOpenDate(date);
    };
    
    loadDate();
    
    // Refresh the date periodically
    const refreshInterval = setInterval(loadDate, CACHE_DURATION);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!openDate) return;
    
    // Now we're on the client, calculate the real values
    const updateCountdown = () => {
      setCountdown(calculateCountdown(openDate));
    };

    // Update immediately on mount
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [openDate]);

  return countdown;
}

function calculateCountdown(openDate: Date): AppsOpenCountdownData {
  const now = new Date();
  const timeDiff = openDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOpen: true,
      formattedString: 'Applications Open!',
      openDate: openDate,
      isHydrated: true,
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
    openDate: openDate,
    isHydrated: true,
  };
}
