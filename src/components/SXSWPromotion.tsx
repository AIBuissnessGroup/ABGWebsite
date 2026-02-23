'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import FloatingShapes from './FloatingShapes';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function SXSWPromotion() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // SXSW Event Date: March 13, 2026 at 11:00 AM CDT
  const eventDate = new Date('2026-03-13T11:00:00-05:00');

  useEffect(() => {
    setIsLoaded(true);
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = eventDate.getTime();
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

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't show if event has passed
  if (isLoaded && isExpired) {
    return null;
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <section id="sxsw-promotion" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Background with Austin-inspired warm accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00274c] via-[#0d1f35] to-[#1a0f0a]" />
      
      {/* Subtle film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm accent glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#bf5a36]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating shapes - very subtle */}
      <FloatingShapes variant="minimal" opacity={0.04} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Flagship badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-4 sm:mb-6"
          >
            <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#bf5a36] to-[#d4764e] text-white shadow-lg shadow-[#bf5a36]/20">
              UPCOMING EVENT • MARCH 13, 2026
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-wide mb-2 sm:mb-3"
          >
            Hail to the{' '}
            <span className="bg-gradient-to-r from-[#bf5a36] to-[#d4764e] bg-clip-text text-transparent">
              Innovators
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-[#BBBBBB] mb-6 sm:mb-8 max-w-2xl mx-auto"
          >
            AI Business Group Brings the University of Michigan to{' '}
            <span className="text-white font-semibold">SXSW 2026</span>
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6 sm:mb-8"
          >
            <p className="text-white/50 text-xs sm:text-sm uppercase tracking-wider mb-3">
              Livestream Begins In
            </p>
            <div className="flex gap-2 sm:gap-3 md:gap-4 justify-center">
              {units.map(({ value, label }) => (
                <div 
                  key={label} 
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[60px] sm:min-w-[70px]"
                >
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white tabular-nums">
                    {isLoaded ? String(value).padStart(2, '0') : '--'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm sm:text-base text-white/60 mb-6 sm:mb-8 max-w-lg mx-auto"
          >
            Join us in Austin for panels on AI & entrepreneurship, live demos, networking with founders and VCs, and innovation showcases.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link
              href="/sxsw"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-white bg-gradient-to-r from-[#bf5a36] to-[#d4764e] hover:from-[#d4764e] hover:to-[#bf5a36] transition-all duration-300 shadow-lg shadow-[#bf5a36]/30 hover:shadow-[#bf5a36]/50 min-h-[48px] sm:min-h-[56px] text-sm sm:text-base"
            >
              Learn More & Watch Live
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>

          {/* Location tag */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-white/40 text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>716 Congress Ave., Austin, Texas</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
