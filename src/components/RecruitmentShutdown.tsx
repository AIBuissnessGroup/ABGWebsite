'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRightIcon,
  RocketLaunchIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Footer from '@/components/Footer';

// Snow particle component
const SnowParticle = ({ delay, duration, x }: { delay: number; duration: number; x: number }) => (
  <motion.div
    initial={{ y: -20, x, opacity: 0 }}
    animate={{ 
      y: '100vh', 
      opacity: [0, 1, 1, 0],
      x: x + Math.sin(delay) * 50 
    }}
    transition={{ 
      duration, 
      delay, 
      repeat: Infinity,
      ease: 'linear'
    }}
    className="absolute w-2 h-2 bg-white rounded-full"
    style={{ filter: 'blur(1px)' }}
  />
);

// Glitch text effect component
const GlitchText = ({ children, className }: { children: string; className?: string }) => {
  const [glitch, setGlitch] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className={`relative ${className}`}>
      <span className={glitch ? 'opacity-0' : ''}>{children}</span>
      {glitch && (
        <>
          <span className="absolute inset-0 text-red-500 -translate-x-1" aria-hidden>
            {children}
          </span>
          <span className="absolute inset-0 text-cyan-500 translate-x-1" aria-hidden>
            {children}
          </span>
        </>
      )}
    </span>
  );
};

export default function RecruitmentShutdown() {
  const router = useRouter();
  const [phase, setPhase] = useState<'shutdown' | 'announcement' | 'ready'>('shutdown');
  const [showCTA, setShowCTA] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);
  
  // Phase progression
  useEffect(() => {
    // Shutdown phase - 2 seconds
    const shutdownTimer = setTimeout(() => {
      setPhase('announcement');
    }, 2000);
    
    // Announcement phase - additional 1.5 seconds
    const announcementTimer = setTimeout(() => {
      setPhase('ready');
    }, 3500);
    
    // Show CTA - additional 0.5 seconds
    const ctaTimer = setTimeout(() => {
      setShowCTA(true);
    }, 4000);
    
    return () => {
      clearTimeout(shutdownTimer);
      clearTimeout(announcementTimer);
      clearTimeout(ctaTimer);
    };
  }, []);
  
  // Auto-redirect countdown
  useEffect(() => {
    if (!showCTA || !autoRedirect) return;
    
    const interval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          router.push('/portal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showCTA, autoRedirect, router]);
  
  // Generate snow particles
  const snowParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
  }));

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0a0a]">
      {/* Snow effect overlay */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {snowParticles.map(particle => (
          <SnowParticle 
            key={particle.id} 
            delay={particle.delay} 
            duration={particle.duration}
            x={particle.x}
          />
        ))}
      </div>
      
      {/* Static/noise overlay */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-20 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 0.1, repeat: Infinity }}
      />
      
      {/* Scan lines */}
      <div 
        className="fixed inset-0 pointer-events-none z-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />
      
      {/* Main content */}
      <section className="flex-1 flex flex-col items-center justify-center relative z-30 px-4 sm:px-6 md:px-8 py-12">
        <AnimatePresence mode="wait">
          {/* Phase 1: Shutdown animation */}
          {phase === 'shutdown' && (
            <motion.div
              key="shutdown"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Old recruitment text with strikethrough effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-600 relative">
                  <span className="relative">
                    <GlitchText>Recruitment</GlitchText>
                    {/* Strikethrough line animation */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
                      className="absolute top-1/2 left-0 right-0 h-1 bg-red-500 origin-left"
                      style={{ transform: 'translateY(-50%)' }}
                    />
                  </span>
                </h1>
                
                {/* System shutdown text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-red-500 font-mono text-sm mt-4 tracking-wider"
                >
                  SYSTEM_SHUTDOWN_INITIATED...
                </motion.p>
              </motion.div>
            </motion.div>
          )}
          
          {/* Phase 2 & 3: Announcement and Ready */}
          {(phase === 'announcement' || phase === 'ready') && (
            <motion.div
              key="announcement"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                  <Image 
                    src="/logo.png" 
                    alt="ABG Logo" 
                    width={60} 
                    height={60} 
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </motion.div>
              
              {/* Status badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </motion.span>
                  APPLICATIONS NOW LIVE
                </span>
              </motion.div>
              
              {/* Main headline */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
              >
                Recruitment is{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
                  Live
                </span>
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl sm:text-2xl text-gray-400 mb-4"
              >
                Winter 2026 Applications are Open
              </motion.p>
              
              {/* Custom portal callout */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-10"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <SparklesIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">
                    We&apos;ve launched a <span className="text-white font-semibold">custom-built application portal</span>
                  </span>
                </div>
              </motion.div>
              
              {/* CTA Section */}
              <AnimatePresence>
                {showCTA && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Main CTA Button */}
                    <Link href="/portal">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-bold text-lg rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300"
                      >
                        <RocketLaunchIcon className="w-6 h-6" />
                        Enter Application Portal
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                      </motion.button>
                    </Link>
                    
                    {/* Auto-redirect notice */}
                    {autoRedirect && redirectCountdown > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <p className="text-gray-500 text-sm">
                          Redirecting to portal in{' '}
                          <span className="text-white font-mono">{redirectCountdown}s</span>
                        </p>
                        <button
                          onClick={() => setAutoRedirect(false)}
                          className="text-gray-500 text-xs hover:text-gray-400 underline transition-colors"
                        >
                          Cancel auto-redirect
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Features preview */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
              >
                {[
                  { icon: '📝', label: 'Track Application Status' },
                  { icon: '📅', label: 'Book Coffee Chats' },
                  { icon: '🚀', label: 'Schedule Interviews' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-gray-400 text-sm">{feature.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      
      {/* Footer */}
      <div className="relative z-30">
        <Footer />
      </div>
    </main>
  );
}
