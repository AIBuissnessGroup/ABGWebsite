'use client';
import { motion } from 'framer-motion';
import { RocketLaunchIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAppsOpenCountdown } from '../hooks/useAppsOpenCountdown';

interface ApplicationCTAProps {
  className?: string;
  deadlineString?: string;
}

export default function ApplicationCTA({ className = '', deadlineString }: ApplicationCTAProps) {
  const appsOpenCountdown = useAppsOpenCountdown();

  // If apps are not open yet, show countdown to opening
  if (!appsOpenCountdown.isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className={`flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 ${className}`}
      >
        {/* Disabled Apply Now Button */}
        <div
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white/50 bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed whitespace-nowrap"
          aria-disabled="true"
          title="Applications open Thursday at 7:40 PM EST"
        >
          <RocketLaunchIcon className="w-5 h-5" />
          Apply Now
        </div>

        {/* Apps Open Countdown Pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 backdrop-blur-sm text-yellow-300 text-sm whitespace-nowrap"
          aria-label="Applications open Thursday January 16 at 7:40 PM EST"
          title="Applications open Thursday January 16 at 7:40 PM EST"
        >
          {/* Pulsing clock icon */}
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
            Apps open in {appsOpenCountdown.formattedString}
          </span>
        </motion.div>
      </motion.div>
    );
  }

  // Apps are open - show the Apply Now button (link to recruitment page)
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
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-md font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#00274c] whitespace-nowrap"
        aria-label="Apply now for AI Business Group membership"
      >
        <RocketLaunchIcon className="w-5 h-5" />
        Apply Now
      </motion.a>

      {/* Applications Open Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-green-400/30 bg-green-500/10 backdrop-blur-sm text-green-300 text-sm whitespace-nowrap"
      >
        {/* Pulsing dot */}
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
          className="w-2 h-2 bg-green-400 rounded-full"
        />
        
        <span className="font-medium">
          Applications Open!
        </span>
      </motion.div>
    </motion.div>
  );
}