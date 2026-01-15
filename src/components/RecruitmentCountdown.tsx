'use client';

import { motion } from 'framer-motion';
import { ClockIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAppsOpenCountdown } from '@/hooks/useAppsOpenCountdown';
import Footer from '@/components/Footer';
import FloatingShapes from '@/components/FloatingShapes';

export default function RecruitmentCountdown() {
  const countdown = useAppsOpenCountdown();

  return (
    <main className="bg-[#00274c] text-white min-h-screen flex flex-col">
      <section 
        className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-8"
        style={{
          background: `linear-gradient(135deg, #00274c 0%, #1a2c45 50%, #2d3e5a 100%)`,
        }}
      >
        {/* Floating Background Shapes */}
        <FloatingShapes variant="dense" opacity={0.08} />

        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute -top-40 -right-40 w-80 h-80 border border-yellow-400/10 rounded-full"
          />
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 border border-yellow-400/10 rounded-full"
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Clock Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/20 border border-yellow-400/30"
            >
              <ClockIcon className="w-12 h-12 text-yellow-400" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
          >
            Applications Opening Soon
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl sm:text-2xl text-gray-300 mb-12"
          >
            Winter 2026 Recruitment
          </motion.p>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {/* Days */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 min-w-[100px]">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-400">
                    {countdown.isHydrated ? countdown.days : '--'}
                  </span>
                </div>
                <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">Days</span>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 min-w-[100px]">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-400">
                    {countdown.isHydrated ? countdown.hours.toString().padStart(2, '0') : '--'}
                  </span>
                </div>
                <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">Hours</span>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 min-w-[100px]">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-400">
                    {countdown.isHydrated ? countdown.minutes.toString().padStart(2, '0') : '--'}
                  </span>
                </div>
                <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">Minutes</span>
              </div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 min-w-[100px]">
                  {countdown.isHydrated ? (
                    <motion.span
                      key={countdown.seconds}
                      initial={{ opacity: 0.5, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-400"
                    >
                      {countdown.seconds.toString().padStart(2, '0')}
                    </motion.span>
                  ) : (
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-400">
                      --
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">Seconds</span>
              </div>
            </div>
          </motion.div>

          {/* Opening Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/10 border border-yellow-400/30 text-yellow-300">
              <BellIcon className="w-5 h-5" />
              <span className="font-medium">
                Thursday, January 16th at 7:40 PM EST
              </span>
            </div>
          </motion.div>

          {/* Info Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Get ready to join Michigan&apos;s premier student-run AI consulting organization. 
            Applications will open at our Mass Meeting. Stay tuned!
          </motion.p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
