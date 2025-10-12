'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import FloatingShapes from './FloatingShapes'
import Link from 'next/link'

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

// Hook for countdown functionality
const useEventCountdown = (eventDate: string, endDate?: string) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const startTime = new Date(eventDate).getTime();
      const endTime = endDate ? new Date(endDate).getTime() : startTime + (2 * 60 * 60 * 1000);
      
      if (now >= startTime && now <= endTime) {
        setIsLive(true);
        setIsEnded(false);
        return;
      }
      
      if (now > endTime) {
        setIsEnded(true);
        setIsLive(false);
        return;
      }
      
      setIsLive(false);
      setIsEnded(false);
      
      const difference = startTime - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [eventDate, endDate]);

  return { timeLeft, isLive, isEnded };
};

// Countdown component
const EventCountdownDisplay = ({ eventDate, endDate }: { eventDate: string; endDate?: string }) => {
  const { timeLeft, isLive, isEnded } = useEventCountdown(eventDate, endDate);

  if (isEnded) return null;

  if (isLive) {
    return (
      <div className="text-center py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          LIVE NOW
        </div>
      </div>
    );
  }

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="text-center py-2">
      <div className="text-xs text-blue-200 mb-1">Starts in:</div>
      <div className="flex justify-center gap-2 text-sm">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{timeLeft.days}</span>
            <span className="text-blue-200 text-xs">day{timeLeft.days !== 1 ? 's' : ''}</span>
          </div>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{formatTime(timeLeft.hours)}</span>
            <span className="text-blue-200 text-xs">hr{timeLeft.hours !== 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-lg">{formatTime(timeLeft.minutes)}</span>
          <span className="text-blue-200 text-xs">min</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-lg">{formatTime(timeLeft.seconds)}</span>
          <span className="text-blue-200 text-xs">sec</span>
        </div>
      </div>
    </div>
  );
};

const EventsListDesign = ({ 
  title = "Events", 
  description = "Join us at our upcoming events and connect with the community." 
}: EventsListDesignProps) => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState('upcoming')
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card')
  
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

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      const eventDate = new Date(event.eventDate || event.date);
      const now = new Date();
      
      if (selectedFilter === 'upcoming') return eventDate >= now;
      if (selectedFilter === 'past') return eventDate < now;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.eventDate || a.date).getTime();
      const dateB = new Date(b.eventDate || b.date).getTime();
      return selectedFilter === 'past' ? dateB - dateA : dateA - dateB;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString().padStart(2, '0'),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return timeString
    }
  }

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

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
        >
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['all', 'upcoming', 'past'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 capitalize ${
                  selectedFilter === filter
                    ? 'bg-white text-[#00274c] shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-white text-[#00274c] shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                viewMode === 'card'
                  ? 'bg-white text-[#00274c] shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Card View
            </button>
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div 
          layout
          className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-6'}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <motion.div
                key="no-events"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={viewMode === 'card' ? 'col-span-full' : ''}
              >
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Events Found</h3>
                  <p className="text-blue-200">
                    {selectedFilter === 'upcoming' && 'No upcoming events at the moment.'}
                    {selectedFilter === 'past' && 'No past events to display.'}
                    {selectedFilter === 'all' && 'No events available.'}
                  </p>
                  {session?.user?.roles?.includes('admin' as any) && (
                    <Link
                      href="/admin/events"
                      className="inline-block mt-6 px-6 py-3 bg-white text-[#00274c] rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg"
                    >
                      Add New Event
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : (
              filteredEvents.map((event, index) => {
                const eventDate = formatDate(event.eventDate || event.date)
                const eventTime = formatTime(event.eventTime || event.time || '')
                const isUpcomingNext = selectedFilter === 'upcoming' && index === 0
                
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeOut",
                      layout: { duration: 0.4 }
                    }}
                    whileHover={{ y: -5 }}
                    className={viewMode === 'card' ? 'h-full' : ''}
                  >
                    {viewMode === 'list' ? (
                      // List View
                      <div className="border border-white/20 rounded-2xl p-1 backdrop-blur-sm">
                        <div 
                          className="rounded-2xl overflow-hidden relative min-h-[140px] sm:min-h-[120px]"
                          style={{
                            backgroundImage: event.imageUrl 
                              ? `linear-gradient(to right, rgba(0, 39, 76, 0.4) 0%, rgba(0, 39, 76, 0.3) 30%, rgba(0, 39, 76, 0.2) 60%, rgba(0, 39, 76, 0.1) 80%, transparent 100%), url(${event.imageUrl})`
                              : 'linear-gradient(135deg, #00274c 0%, #1a2c45 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#00274c]/60 via-[#00274c]/40 to-transparent" />
                          
                          <div className="relative z-10 p-6 h-full flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                            {/* Date Section */}
                            <div className="flex-shrink-0">
                              <div className="bg-[#00274c] backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px] shadow-lg border border-white/30">
                                <div className="text-sm font-semibold text-white">
                                  {eventDate.month}
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold text-white leading-none">
                                  {eventDate.day}
                                </div>
                                <div className="text-xs text-white/80 mt-1">
                                  {eventDate.weekday}
                                </div>
                              </div>
                            </div>
                            
                            {/* Content Section */}
                            <div className="flex-grow min-w-0">
                              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                                {event.title}
                              </h3>
                              <p className="text-blue-100 text-sm sm:text-base mb-3 line-clamp-2 leading-relaxed">
                                {event.description}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                                {eventTime && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-white/80">🕒</span>
                                    {eventTime}
                                  </div>
                                )}
                                {(event.location || event.venue) && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-white/80">📍</span>
                                    {event.location || event.venue}
                                  </div>
                                )}
                                {(event.eventType || event.type) && (
                                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                                    {event.eventType || event.type}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex-shrink-0 w-full sm:w-auto">
                              <Link
                                href={`/events/${event.id}`}
                                className="block w-full sm:w-auto text-center px-6 py-3 bg-white text-[#00274c] rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                View Details
                              </Link>
                              
                              {/* Countdown for next upcoming event */}
                              {isUpcomingNext && (
                                <div className="mt-3">
                                  <EventCountdownDisplay 
                                    eventDate={event.eventDate || event.date} 
                                    endDate={event.endDate}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Card View
                      <div className="border border-white/20 rounded-2xl p-1 backdrop-blur-sm h-full">
                        <div 
                          className="rounded-2xl overflow-hidden relative h-full min-h-[320px] flex flex-col"
                          style={{
                            backgroundImage: event.imageUrl 
                              ? `linear-gradient(to bottom, rgba(0, 39, 76, 0.3) 0%, rgba(0, 39, 76, 0.6) 100%), url(${event.imageUrl})`
                              : 'linear-gradient(135deg, #00274c 0%, #1a2c45 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-[#00274c]/80 via-[#00274c]/40 to-[#00274c]/30" />
                          
                          <div className="relative z-10 p-6 h-full flex flex-col">
                            {/* Date Badge */}
                            <div className="self-start mb-4">
                              <div className="bg-[#00274c] backdrop-blur-sm rounded-xl p-3 text-center shadow-lg border border-white/30">
                                <div className="text-xs font-semibold text-white">
                                  {eventDate.month}
                                </div>
                                <div className="text-xl font-bold text-white leading-none">
                                  {eventDate.day}
                                </div>
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-grow flex flex-col">
                              <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                                {event.title}
                              </h3>
                              <p className="text-blue-100 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
                                {event.description}
                              </p>
                              
                              {/* Event Details */}
                              <div className="space-y-2 text-sm text-blue-200 mb-6">
                                {eventTime && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-white/80">🕒</span>
                                    {eventTime}
                                  </div>
                                )}
                                {(event.location || event.venue) && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-white/80">📍</span>
                                    <span className="truncate">{event.location || event.venue}</span>
                                  </div>
                                )}
                                {(event.eventType || event.type) && (
                                  <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                                    {event.eventType || event.type}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <Link
                              href={`/events/${event.id}`}
                              className="block text-center px-6 py-3 bg-white text-[#00274c] rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mt-auto"
                            >
                              View Details
                            </Link>
                            
                            {/* Countdown for next upcoming event */}
                            {isUpcomingNext && (
                              <EventCountdownDisplay 
                                eventDate={event.eventDate || event.date} 
                                endDate={event.endDate}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* Admin Controls */}
        {session?.user?.roles?.includes('admin' as any) && filteredEvents.length > 0 && (
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