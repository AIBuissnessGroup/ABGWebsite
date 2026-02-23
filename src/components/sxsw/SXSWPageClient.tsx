'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarIcon, MapPinIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import FloatingShapes from '@/components/FloatingShapes';
import Footer from '@/components/Footer';
import SXSWLivestreamPlayer from './SXSWLivestreamPlayer';
import PanelScheduleCard from './PanelScheduleCard';
import { SXSWEventData, SXSWPanel } from '@/types/events';

export default function SXSWPageClient() {
  const [eventData, setEventData] = useState<SXSWEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const response = await fetch('/api/events/sxsw');
      if (!response.ok) throw new Error('Failed to fetch event data');
      const data = await response.json();
      setEventData(data);
    } catch (err) {
      console.error('Error fetching SXSW data:', err);
      setError('Unable to load event data');
    } finally {
      setLoading(false);
    }
  };

  // Check if panel is currently live
  const isPanelLive = (panel: SXSWPanel): boolean => {
    const now = Date.now();
    return now >= panel.startTime && now <= panel.endTime;
  };

  // Get current live panel
  const currentPanel = eventData?.panels?.find(isPanelLive);

  // Format date for display
  const formatEventDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display (in Austin CDT timezone)
  const formatEventTime = (startTime: number, endTime: number) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    };
    return `${start.toLocaleTimeString('en-US', options)} - ${end.toLocaleTimeString('en-US', options)} CDT`;
  };

  if (loading) {
    return (
      <div className="sxsw-bg min-h-screen flex items-center justify-center">
        <div className="sxsw-content text-center">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-white/10 rounded mb-4 mx-auto" />
            <div className="h-4 w-48 bg-white/10 rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="sxsw-bg min-h-screen flex items-center justify-center">
        <div className="sxsw-content text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Event</h1>
          <p className="text-white/60 mb-6">{error || 'Event data not available'}</p>
          <Link href="/" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(eventData.eventDate);
  const isEventDay = new Date().toDateString() === eventDate.toDateString();
  const isUpcoming = Date.now() < eventData.eventDate;

  return (
    <div className="sxsw-bg">
      {/* Floating Shapes - more visible in background */}
      <FloatingShapes variant="dense" opacity={0.06} />

      <div className="sxsw-content">
        {/* Hero Section */}
        <section className="pt-2 pb-6 sm:pt-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Back link */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 sm:mb-6"
            >
              <Link 
                href="/events" 
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Events
              </Link>
            </motion.div>

            {/* Event Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-12"
            >
              {/* Austin accent tag */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold austin-gradient text-white">
                  UPCOMING EVENT
                </span>
                {isEventDay && eventData.livestream?.status === 'live' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full live-indicator" />
                    LIVE NOW
                  </span>
                )}
              </div>

              <h1 className="sxsw-heading text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-2 sm:mb-3 px-2 sm:px-0">
                {eventData.title}
              </h1>
              <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-[#BBBBBB] font-medium px-2 sm:px-0">
                {eventData.subtitle}
              </p>

              {/* Event meta */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 text-white/70 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 austin-accent" />
                  <span>{formatEventDate(eventData.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 austin-accent" />
                  <span>{formatEventTime(eventData.eventDate, eventData.endDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 austin-accent" />
                  <span>{eventData.location}</span>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Separator line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Main Content - Livestream & Schedule Row */}
        <section className="pt-6 pb-8 sm:pt-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              
              {/* Left Column - Schedule (smaller, shows second on mobile) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="order-2 lg:order-1 lg:col-span-2"
              >
                <div className="sxsw-glass-card p-4 sm:p-6 h-full">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Day Schedule
                  </h2>
                  <p className="text-white/60 text-sm mb-4 sm:mb-6">
                    Panels, keynotes, and activations throughout the day
                  </p>

                  {/* Schedule List */}
                  <div ref={scheduleRef} className="sxsw-schedule-list space-y-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2">
                    {eventData.panels && eventData.panels.length > 0 ? (
                      eventData.panels.map((panel, index) => (
                        <PanelScheduleCard
                          key={panel.id}
                          panel={panel}
                          isLive={isPanelLive(panel)}
                          index={index}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/50 text-sm">
                          Official schedule will be posted soon
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Livestream (larger, shows first on mobile) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="order-1 lg:order-2 lg:col-span-3"
              >
                <div className="sxsw-glass-card p-4 sm:p-6 h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Livestream
                    </h2>
                    {eventData.livestream?.status === 'live' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-white rounded-full live-indicator" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    {eventData.livestream?.description || 'Watch live from Hail to the Innovators'}
                  </p>

                  {/* Livestream Player with Countdown */}
                  <SXSWLivestreamPlayer
                    livestream={eventData.livestream}
                    eventDate={eventDate}
                    currentPanel={currentPanel}
                    showCountdown={isUpcoming}
                  />

                  {/* Current Panel Info */}
                  {currentPanel && eventData.livestream?.status === 'live' && (
                    <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-austin-accent font-semibold uppercase tracking-wide mb-1">
                        Now Playing
                      </p>
                      <p className="text-white font-medium">{currentPanel.title}</p>
                      {currentPanel.speakers && currentPanel.speakers.length > 0 && (
                        <p className="text-white/60 text-sm mt-1">
                          {currentPanel.speakers.map(s => s.name).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Sections Row */}
        <section className="pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              
              {/* About Event Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="sxsw-glass-card p-4 sm:p-6 h-full">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                    About the Event
                  </h3>
                  <div className="text-white/70 text-sm sm:text-base whitespace-pre-line leading-relaxed">
                    {eventData.aboutEvent}
                  </div>
                </div>
              </motion.div>

              {/* About Livestream Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="sxsw-glass-card p-4 sm:p-6 h-full">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                    About the Livestream
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                    {eventData.aboutLivestream || 'Join us virtually as we livestream panels, keynotes, and special moments from Hail to the Innovators at SXSW 2026. Watch live from anywhere in the world.'}
                  </p>

                  {/* Streaming platforms */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Also streaming on</p>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                        </svg>
                        Instagram
                      </span>
                      <span className="text-white/60 text-sm flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Registration CTA */}
        {eventData.waitlistUrl && (
          <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <div className="sxsw-glass-card p-4 sm:p-6 text-center">
                  <p className="text-white/70 text-xs sm:text-sm mb-3">
                    {eventData.isEventFull 
                      ? "Event is full. Join the waitlist to be notified if spots open up."
                      : "Register to attend in person"
                    }
                  </p>
                  <a
                    href={eventData.waitlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full xs:w-auto px-6 py-3 rounded-full font-semibold text-white austin-gradient hover:opacity-90 transition-opacity min-h-[48px] text-sm sm:text-base"
                  >
                    {eventData.isEventFull ? 'Join Waitlist' : 'Register Now'}
                  </a>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
