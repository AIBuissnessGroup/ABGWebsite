'use client';
import { motion } from 'framer-motion';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useApplicationCountdown, formatDeadlineForAria } from '../hooks/useApplicationCountdown';

interface ApplicationCTAProps {
  className?: string;
  deadlineString?: string;
}

export default function ApplicationCTA({ className = '', deadlineString }: ApplicationCTAProps) {
  const countdown = useApplicationCountdown(deadlineString);

  if (countdown.isEnded) {
    // Show "Get Notified" button when applications are closed
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className={`flex flex-col gap-3 ${className}`}
      >
        <motion.a
          href="/recruitment"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl shadow-lg font-semibold text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#00274c]"
          aria-label="Get notified when applications reopen"
        >
          <RocketLaunchIcon className="w-5 h-5" />
          Get Notified
        </motion.a>
        
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-400/30 bg-gray-800/20 text-gray-300 text-sm">
          Applications Closed
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className={`flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 ${className}`}
    >
      {/* Apply Now Button */}
      <motion.a
        href="/recruitment"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        animate={countdown.isEndingSoon ? {
          boxShadow: [
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          ]
        } : {}}
        transition={{
          boxShadow: countdown.isEndingSoon ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}
        }}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#00274c] whitespace-nowrap"
        aria-label="Apply now for AI Business Group membership"
      >
        <RocketLaunchIcon className="w-5 h-5" />
        Apply Now
      </motion.a>

      {/* Countdown Pill */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white/90 text-sm whitespace-nowrap"
        aria-label={`Applications close on ${formatDeadlineForAria(countdown.deadline)}`}
        title={`Applications close on ${formatDeadlineForAria(countdown.deadline)}`}
      >
        {/* Optional pulsing dot - respect reduced motion */}
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
          className="w-2 h-2 bg-white rounded-full motion-reduce:opacity-100 motion-reduce:scale-100"
        />
        
        <span className="font-medium">
          Apps close in {countdown.formattedString}
        </span>
      </motion.div>
    </motion.div>
  );
}