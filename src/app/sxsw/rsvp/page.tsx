'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeftIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import FloatingShapes from '@/components/FloatingShapes';

interface Event {
  title: string;
  time: string;
  rsvpLink: string;
}

const events: Event[] = [
  {
    title: 'The Next Wave: AI and Human Innovation',
    time: '10:30 AM - 11:30 AM CST',
    rsvpLink: 'https://lnkd.in/gTyJEvN5',
  },
  {
    title: 'Innovation and Future Work of Thinkers',
    time: '12:30 PM - 1:10 PM CST',
    rsvpLink: 'https://luma.com/l63nziov',
  },
  {
    title: 'Research to Reality: How U-Michigan Turns Ideas into Impact',
    time: '1:50 PM - 2:50 PM CST',
    rsvpLink: 'https://luma.com/wuyaqn3n',
  },
  {
    title: 'AI In Action: Prompt to Prototype Workshop',
    time: '3:20 PM - 3:50 PM CST',
    rsvpLink: 'https://luma.com/wuyaqn3n',
  },
];

export default function SXSWRSVPPage() {
  return (
    <div className="sxsw-bg min-h-screen">
      <FloatingShapes variant="dense" opacity={0.06} />

      <div className="sxsw-content">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 sm:mb-8"
            >
              <Link
                href="/sxsw"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to SXSW
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8 sm:mb-12"
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold austin-gradient text-white">
                  SXSW 2026
                </span>
              </div>
              <h1 className="sxsw-heading text-3xl sm:text-4xl md:text-5xl text-white mb-3">
                RSVP for Events
              </h1>
              <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto">
                Join us at SXSW 2026! Select an event below to RSVP and secure your spot.
              </p>
            </motion.div>

            {/* Event Cards */}
            <div className="space-y-4 sm:space-y-5">
              {events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 sm:p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg sm:text-xl mb-2 leading-tight">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/60">
                        <ClockIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{event.time}</span>
                      </div>
                    </div>
                    <a
                      href={event.rsvpLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 austin-gradient text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base whitespace-nowrap"
                    >
                      RSVP Now
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center text-white/40 text-sm mt-8 sm:mt-12"
            >
              All times are in Central Standard Time (CST)
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
