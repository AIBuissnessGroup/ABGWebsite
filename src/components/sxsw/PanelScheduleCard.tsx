'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SXSWPanel } from '@/types/events';
import { ClockIcon, MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface PanelScheduleCardProps {
  panel: SXSWPanel;
  isLive: boolean;
  index: number;
}

export default function PanelScheduleCard({ panel, isLive, index }: PanelScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Format time in Austin timezone (CDT)
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });
  };

  // Get panel type badge color
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'keynote':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'demo':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'networking':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'break':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'activation':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  // Check if panel is in the past
  const isPast = Date.now() > panel.endTime;
  const hasLongDescription = panel.description && panel.description.length > 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`
        relative rounded-xl border transition-all overflow-hidden
        ${isLive 
          ? 'sxsw-panel-live border-[#bf5a36]/50 bg-gradient-to-br from-[#bf5a36]/15 to-[#bf5a36]/5' 
          : isPast
            ? 'border-white/5 bg-white/[0.02] opacity-50'
            : 'border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:from-white/[0.08] hover:to-white/[0.04]'
        }
      `}
    >
      {/* Accent line at top for live panels */}
      {isLive && (
        <div className="h-1 w-full bg-gradient-to-r from-[#bf5a36] via-[#d4754b] to-[#bf5a36]" />
      )}

      <div className="p-3 sm:p-4">
        {/* Header row: Time and Type badge */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
            <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">
              {formatTime(panel.startTime)} - {formatTime(panel.endTime)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {panel.type !== 'panel' && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeBadgeClass(panel.type)}`}>
                {panel.type.charAt(0).toUpperCase() + panel.type.slice(1)}
              </span>
            )}
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full live-indicator" />
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className={`text-sm sm:text-base font-bold mb-1.5 sm:mb-2 leading-tight ${isLive ? 'text-white' : 'text-white/95'}`}>
          {panel.title}
        </h4>

        {/* Description with View More */}
        {panel.description && (
          <div className="mb-3">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.p
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs sm:text-sm text-white/60 leading-relaxed"
                >
                  {panel.description}
                </motion.p>
              ) : (
                <motion.p
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs sm:text-sm text-white/60 line-clamp-2"
                >
                  {panel.description}
                </motion.p>
              )}
            </AnimatePresence>
            {hasLongDescription && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 mt-1.5 text-xs text-[#bf5a36] hover:text-[#d4754b] transition-colors font-medium"
              >
                {isExpanded ? 'Show less' : 'View more'}
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Speakers */}
        {panel.speakers && panel.speakers.length > 0 && (
          <div className="pt-2 sm:pt-3 border-t border-white/10 space-y-1.5 sm:space-y-2">
            {panel.speakers.map((speaker) => (
              <div key={speaker.id} className="flex items-center gap-2 sm:gap-3">
                {/* Speaker photo */}
                {speaker.photo ? (
                  <img
                    src={speaker.photo}
                    alt={speaker.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-white/80 font-medium">
                      {speaker.name.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Speaker info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/90 font-medium truncate">
                    {speaker.name}
                  </p>
                  {(speaker.title || speaker.company) && (
                    <p className="text-[10px] sm:text-xs text-white/50 truncate">
                      {speaker.title}{speaker.title && speaker.company ? ' · ' : ''}{speaker.company}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom row: Location and Company logos */}
        {(panel.location || (panel.speakers && panel.speakers.some(s => s.companyLogo))) && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 sm:mt-3 pt-2 border-t border-white/5">
            {panel.location ? (
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/40">
                <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{panel.location}</span>
              </div>
            ) : (
              <div />
            )}
            
            {/* Company logos */}
            {panel.speakers && panel.speakers.some(s => s.companyLogo) && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-white/20">
                {panel.speakers
                  .filter(s => s.companyLogo)
                  .filter((s, i, arr) => arr.findIndex(x => x.companyLogo === s.companyLogo) === i)
                  .map((speaker) => (
                    <img
                      key={speaker.id}
                      src={speaker.companyLogo}
                      alt={speaker.company}
                      className="h-3 sm:h-4 md:h-5 w-auto object-contain"
                      title={speaker.company}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
