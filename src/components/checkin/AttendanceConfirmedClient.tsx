'use client';

import { motion } from 'framer-motion';
import FloatingShapes from '@/components/FloatingShapes';
import { useState, useEffect } from 'react';

// Simple lightweight confetti particle generator
function ConfettiCanvas() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    vx: number;
    vy: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#10B981', '#34D399', '#FF6700', '#F59E0B', '#3B82F6', '#60A5FA', '#FFFFFF'];
    const newParticles = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() * 20 - 10),
      y: 40 + (Math.random() * 10 - 5),
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vx: (Math.random() - 0.5) * 80,
      vy: -(Math.random() * 60 + 30),
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            left: `${p.x + p.vx}%`,
            top: `${p.y + p.vy + 120}%`,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.4],
            rotate: p.rotation + 720,
          }}
          transition={{
            duration: 2.2 + Math.random() * 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size * (Math.random() > 0.5 ? 1 : 1.6)}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.4 ? '2px' : '999px',
          }}
        />
      ))}
    </div>
  );
}

export default function AttendanceConfirmedClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Ambience & Lighting */}
      <FloatingShapes variant="dense" opacity={0.05} />
      
      {/* Ambient glow auras */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[350px] bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[350px] bg-orange-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Confetti Animation Layer */}
      <ConfettiCanvas />

      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-md w-full bg-white/[0.05] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/60 pt-9 pb-9 px-6 sm:px-8 text-center"
      >
        {/* Glowing Top Emerald Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Layered Pulsing Rings around the Checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-emerald-500/25 blur-sm"
          />
          <div className="absolute inset-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 animate-pulse" />
          
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
            className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-600/40 border border-emerald-300/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              data-slot="icon"
              className="w-9 h-9 stroke-[3]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </motion.div>
        </div>

        {/* Attendance Confirmed Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              data-slot="icon"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
              />
            </svg>
            Attendance Confirmed
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            All Checked In!
          </h1>
        </motion.div>
      </motion.div>
    </div>
  );
}
