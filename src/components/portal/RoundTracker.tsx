'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import type { RoundTrackerData, RoundStatus } from '@/types/recruitment';

interface RoundTrackerProps {
  tracker: RoundTrackerData;
}

type RoundDisplayStatus = 'completed' | 'current' | 'upcoming' | 'skipped';

// Map round status to display status
function getDisplayStatus(round: RoundStatus, currentRound: number): RoundDisplayStatus {
  if (round.status === 'completed' || round.status === 'advanced') return 'completed';
  if (round.status === 'not_advanced') return 'skipped';
  if (round.round === currentRound) return 'current';
  return 'upcoming';
}

export default function RoundTracker({ tracker }: RoundTrackerProps) {
  const { rounds, currentRound, nextAction } = tracker;
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setHasAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="portal-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Your Progress</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Step {currentRound} of {rounds.length}
        </span>
      </div>

      {/* Progress Steps - Aligned Design */}
      <div className="relative">
        {/* Background connector line */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />
        
        {/* Animated progress line */}
        <motion.div 
          className="absolute top-5 left-5 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: hasAnimated 
              ? `calc(${((currentRound - 1) / (rounds.length - 1)) * 100}% - 40px)` 
              : 0 
          }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {rounds.map((round, idx) => {
            const displayStatus = getDisplayStatus(round, currentRound);
            
            return (
              <motion.div 
                key={round.round} 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                {/* Circle */}
                <motion.div 
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                    displayStatus === 'completed' 
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' 
                      : displayStatus === 'current' 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white ring-4 ring-blue-200' 
                      : displayStatus === 'skipped' 
                      ? 'bg-red-100 text-red-500 border-2 border-red-300' 
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: idx * 0.15 + 0.2 
                  }}
                >
                  {displayStatus === 'completed' ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: idx * 0.15 + 0.4, type: "spring" }}
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </motion.div>
                  ) : displayStatus === 'skipped' ? (
                    <XCircleIcon className="w-6 h-6" />
                  ) : displayStatus === 'current' ? (
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {round.round}
                    </motion.span>
                  ) : (
                    round.round
                  )}
                </motion.div>
                
                {/* Label */}
                <motion.div 
                  className="mt-3 text-center max-w-[80px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.15 + 0.3 }}
                >
                  <p className={`text-xs font-semibold leading-tight ${
                    displayStatus === 'current' 
                      ? 'text-blue-600' 
                      : displayStatus === 'completed' 
                      ? 'text-green-600' 
                      : displayStatus === 'skipped' 
                      ? 'text-red-500' 
                      : 'text-gray-400'
                  }`}>
                    {round.name.replace('Round ', 'R').replace(': Technical Interview', '').replace(': Behavioral Interview', '')}
                  </p>
                  {displayStatus === 'current' && (
                    <motion.span 
                      className="inline-block mt-1 text-[10px] text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      Current
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Next Action */}
      {nextAction && (
        <motion.div 
          className="mt-6 flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ClockIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 text-sm">{nextAction.title}</p>
            {nextAction.deadline && (
              <p className="text-xs text-amber-600 mt-0.5">
                Due {new Date(nextAction.deadline).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
          {nextAction.actionUrl && (
            <a
              href={nextAction.actionUrl}
              className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              Go
              <ArrowRightIcon className="w-4 h-4" />
            </a>
          )}
        </motion.div>
      )}

      {/* Success State */}
      {tracker.rounds.every(r => r.status === 'completed' || r.status === 'advanced') && (
        <motion.div 
          className="mt-6 flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-green-700 font-medium text-sm">
            🎉 All rounds completed! Check your email for next steps.
          </p>
        </motion.div>
      )}
    </div>
  );
}