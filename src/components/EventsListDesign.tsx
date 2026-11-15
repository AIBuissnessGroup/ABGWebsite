'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSession } from 'next-auth/react'
import FloatingShapes from './FloatingShapes'
import Link from 'next/link'
import EventCalendar from './EventCalendar'
import type { CalendarItem } from '@/lib/calendar-links'

// Helper function to check if event is SXSW
const isSXSWEvent = (title: string): boolean => {
  return title.toLowerCase().includes('sxsw');
};

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  venue?: string;
  type?: string;
  eventType?: string;
  maxAttendees?: number;
  capacity?: number;
  registrationRequired: boolean;
  registrationLink?: string;
  registrationDeadline?: string;
  imageUrl?: string;
  eventDate?: string;
  eventTime?: string;
  endDate?: string;
  attendees?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface EventsListDesignProps {
  title?: string;
  description?: string;
}

const EventsListDesign = ({ 
  title = "Events", 
  description = "Join us at our upcoming events and connect with the community." 
}: EventsListDesignProps) => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: session } = useSession()

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events')
        if (!response.ok) throw new Error('Failed to fetch events')
        const data = await response.json()
        setEvents(Array.isArray(data) ? data : data.events || [])
      } catch (err) {
        console.error('Error loading events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const calendarItems: CalendarItem[] = events
    .map((event) => {
      const start = new Date(event.eventDate || event.date);
      if (isNaN(start.getTime())) return null;
      const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return {
        id: event.id,
        title: event.title,
        start,
        end: isNaN(end.getTime()) || end <= start ? new Date(start.getTime() + 2 * 60 * 60 * 1000) : end,
        description: event.description,
        location: [event.venue, event.location].filter(Boolean).join(', ') || undefined,
        href: isSXSWEvent(event.title) ? '/sxsw' : `/events/${event.id}`,
      } as CalendarItem;
    })
    .filter((item): item is CalendarItem => item !== null);

  const upcomingItems = calendarItems
    .filter((item) => item.end.getTime() >= Date.now())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-[#00274c] via-[#1a365d] to-[#2d4a6b] relative overflow-hidden">
        <FloatingShapes />
        <div className="container mx-auto relative z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading events...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-[#00274c] via-[#1a365d] to-[#2d4a6b] relative overflow-hidden">
        <FloatingShapes />
        <div className="container mx-auto relative z-10">
          <div className="text-center text-red-400">
            <p>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section 
      ref={ref}
      className="py-20 px-4 bg-gradient-to-br from-[#00274c] via-[#1a365d] to-[#2d4a6b] relative overflow-hidden"
    >
      <FloatingShapes />
      
      <div className="container mx-auto relative z-50">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>

        <>
            <EventCalendar items={calendarItems} theme="dark" feedPath="/api/events/calendar.ics" />
            <div className="mt-10">
              <h3 className="text-2xl font-bold text-white mb-4">Upcoming Events</h3>
              {upcomingItems.length === 0 ? (
                <p className="text-blue-200">No upcoming events at the moment.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href ?? '/events'}
                      className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <div className="w-14 shrink-0 rounded-lg bg-[#ffcb05] py-2 text-center text-[#00274c]">
                        <div className="text-xs font-bold">{item.start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
                        <div className="text-xl font-bold leading-none">{item.start.getDate()}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-white">{item.title}</div>
                        <div className="truncate text-sm text-blue-200">
                          {item.start.toLocaleDateString('en-US', { weekday: 'long' })} ·{' '}
                          {item.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {item.location ? ` · ${item.location}` : ''}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </>

        {/* Admin Controls */}
        {session?.user?.roles?.includes('admin' as any) && events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-12"
          >
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              <span>⚙️</span>
              Manage Events
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default EventsListDesign