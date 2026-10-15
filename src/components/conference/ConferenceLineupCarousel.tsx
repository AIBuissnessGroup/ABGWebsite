'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { FEATURED_SESSIONS } from '@/lib/conference-lineup';
import { FaceRow, SessionHeadline } from '@/components/conference/ConferenceLineup';

const AUTO_ADVANCE_MS = 5500;

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -60 : 60, opacity: 0 }),
};

// Rotating session lineup shown inside the home page featured event box
export default function ConferenceLineupCarousel() {
  const [[index, direction], setSlide] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const draggedRef = useRef(false);

  const count = FEATURED_SESSIONS.length;
  const session = FEATURED_SESSIONS[index];

  const go = useCallback((dir: number) => setSlide(([i]) => [(i + dir + count) % count, dir]), [count]);

  // Auto-advance, paused while hovered
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => go(1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [paused, index, go]);

  // Controls sit inside the clickable card, so keep their clicks from navigating
  const control = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div
      className="relative z-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClickCapture={(e) => {
        // A swipe shouldn't also count as a click on the card (which navigates to /conference)
        if (draggedRef.current) {
          e.preventDefault();
          e.stopPropagation();
          draggedRef.current = false;
        }
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FFCB05] truncate">
          The lineup · {session.label} · {session.start}
        </div>
        <div className="h-0.5 w-14 flex-shrink-0 rounded-full bg-white/15 overflow-hidden">
          {!paused && (
            <motion.div
              key={index}
              className="h-full bg-[#FFCB05]"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </div>

      <div className="relative min-h-[178px] sm:min-h-[196px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={session.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => {
              draggedRef.current = true;
            }}
            onDragEnd={(_, info) => {
              setTimeout(() => {
                draggedRef.current = false;
              }, 0);
              if (info.offset.x < -50) go(1);
              else if (info.offset.x > 50) go(-1);
            }}
          >
            <FaceRow speakers={session.speakers} size="xs" showTitle={false} wrap={false} className="!gap-x-1.5 sm:!gap-x-2 pt-1" />
            <SessionHeadline lines={session.headline} animate={false} className="mt-3 text-lg sm:text-xl lg:text-2xl text-center" />
            <div className="mt-1 text-center text-[11px] sm:text-xs text-white/70">
              {session.start} – {session.end} · {session.room}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={control(() => go(-1))}
          className="!min-h-0 !min-w-0 w-6 h-6 rounded-full border border-white/20 hover:border-[#FFCB05]/70 hover:text-[#FFCB05] text-white/70 flex items-center justify-center transition-colors"
          aria-label="Previous session"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1.5">
          {FEATURED_SESSIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={control(() => setSlide([i, i > index ? 1 : -1]))}
              className={`!min-h-0 !min-w-0 p-0 h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-5 bg-[#FFCB05]' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Show ${s.label || s.headline[0]}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={control(() => go(1))}
          className="!min-h-0 !min-w-0 w-6 h-6 rounded-full border border-white/20 hover:border-[#FFCB05]/70 hover:text-[#FFCB05] text-white/70 flex items-center justify-center transition-colors"
          aria-label="Next session"
        >
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
