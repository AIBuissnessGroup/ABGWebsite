'use client';
import { motion } from 'framer-motion';
import { RocketLaunchIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface ApplicationCTAProps {
  className?: string;
  deadlineString?: string;
}

interface CycleData {
  isActive: boolean;
  isUpcoming?: boolean;
  cycleName?: string;
  portalOpenAt?: string;
  portalCloseAt?: string;
  applicationDueAt?: string;
  portalUrl?: string;
}

interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  formattedString: string;
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
      formattedString: 'Applications Closed',
    };
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  let formattedString = '';
  if (days >= 1) {
    formattedString = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  } else {
    formattedString = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isEnded: false,
    formattedString,
  };
}

export default function ApplicationCTA({ className = '', deadlineString }: ApplicationCTAProps) {
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [countdown, setCountdown] = useState<CountdownData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cycle data
  useEffect(() => {
    fetch('/api/public/recruitment-cycle')
      .then(res => res.json())
      .then(data => {
        setCycleData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load recruitment cycle:', err);
        setIsLoading(false);
      });
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!cycleData?.applicationDueAt) return;

    const deadline = new Date(cycleData.applicationDueAt);
    
    const updateCountdown = () => {
      setCountdown(calculateCountdown(deadline));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [cycleData?.applicationDueAt]);

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 ${className}`}
      >
        <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white/50 bg-gradient-to-r from-gray-600 to-gray-700 whitespace-nowrap">
          <RocketLaunchIcon className="w-5 h-5" />
          Loading...
        </div>
      </motion.div>
    );
  }

  // No active cycle or upcoming cycle
  if (!cycleData?.isActive && !cycleData?.isUpcoming) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className={`flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 ${className}`}
      >
        <div
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white/50 bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed whitespace-nowrap"
          aria-disabled="true"
          title="Applications are currently closed"
        >
          <RocketLaunchIcon className="w-5 h-5" />
          Applications Closed
        </div>
      </motion.div>
    );
  }

  // Upcoming cycle - show countdown to portal opening
  if (cycleData?.isUpcoming && cycleData?.portalOpenAt) {
    const openDate = new Date(cycleData.portalOpenAt);
    const now = new Date();
    const timeDiff = openDate.getTime() - now.getTime();
    
    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      let openCountdown = '';
      if (days >= 1) {
        openCountdown = `${days}d ${hours}h ${minutes}m`;
      } else {
        openCountdown = `${hours}h ${minutes}m`;
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className={`flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 ${className}`}
        >
          <div
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white/50 bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed whitespace-nowrap"
            aria-disabled="true"
            title="Applications open soon"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            Apply Now
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 backdrop-blur-sm text-yellow-300 text-sm whitespace-nowrap"
          >
            <motion.div
              animate={{
                opacity: [0.6, 1, 0.6],
                scale: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ClockIcon className="w-4 h-4" />
            </motion.div>
            
            <span className="font-medium">
              Apps open in {openCountdown}
            </span>
          </motion.div>
        </motion.div>
      );
    }
  }

  // Active cycle - show Apply Now with deadline countdown
  const isEndingSoon = countdown && countdown.days < 2 && !countdown.isEnded;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className={`flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 ${className}`}
    >
      {/* Apply Now Button - links to portal */}
      <motion.a
        href="/portal"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#00274c] whitespace-nowrap"
        aria-label="Apply now for AI Business Group membership"
      >
        <RocketLaunchIcon className="w-5 h-5" />
        Apply Now
      </motion.a>

      {/* Deadline Countdown */}
      {countdown && !countdown.isEnded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm text-sm whitespace-nowrap ${
            isEndingSoon 
              ? 'border-red-400/30 bg-red-500/10 text-red-300'
              : 'border-green-400/30 bg-green-500/10 text-green-300'
          }`}
        >
          <motion.div
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`w-2 h-2 rounded-full ${isEndingSoon ? 'bg-red-400' : 'bg-green-400'}`}
          />
          
          <span className="font-medium">
            {isEndingSoon ? `⏰ Due in ${countdown.formattedString}` : `Due in ${countdown.formattedString}`}
          </span>
        </motion.div>
      )}

      {/* Applications closed */}
      {countdown?.isEnded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-400/30 bg-gray-500/10 backdrop-blur-sm text-gray-300 text-sm whitespace-nowrap"
        >
          <span className="font-medium">Applications Closed</span>
        </motion.div>
      )}
    </motion.div>
  );
}