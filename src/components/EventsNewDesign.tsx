'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import FloatingShapes from './FloatingShapes'
import Link from 'next/link'

// Helper function to convert UTC dates to EST for display
const convertUtcToEst = (utcDate: Date): Date => {
  const estOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  return new Date(utcDate.getTime() - estOffset);
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
  imageUrl?: string;
  featured: boolean;
  published: boolean;
  attendanceConfirmEnabled?: number;
  slug?: string;
  eventDate?: number;
  registrationUrl?: string;
  registrationCtaLabel?: string;
}

export default function EventsNewDesign() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  // Helper function to generate URL-friendly slugs
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
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
    .filter(event => {
      if (selectedType === 'all') return true;
      return (event.eventType || event.type)?.toLowerCase() === selectedType.toLowerCase();
    })
    .filter(event => {
      if (!searchQuery) return true;
      return event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
    })
    .sort((a, b) => {
      const dateA = new Date(a.eventDate || a.date).getTime();
      const dateB = new Date(b.eventDate || b.date).getTime();
      return selectedFilter === 'past' ? dateB - dateA : dateA - dateB;
    });

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(event => event.eventType || event.type).filter(Boolean)));

  // Format event date and time
  const formatEventDate = (event: Event) => {
    const eventDate = new Date(event.eventDate || event.date);
    return {
      day: eventDate.getDate().toString().padStart(2, '0'),
      month: eventDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' }).toUpperCase(),
      year: eventDate.getFullYear(),
      time: event.time || eventDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'America/New_York' 
      })
    };
  };

  // Get event type color
  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'WORKSHOP': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'NETWORKING': 'bg-blue-100 text-blue-800 border-blue-200',
      'SYMPOSIUM': 'bg-purple-100 text-purple-800 border-purple-200',
      'CONFERENCE': 'bg-red-100 text-red-800 border-red-200',
      'SOCIAL': 'bg-pink-100 text-pink-800 border-pink-200',
      'MEETING': 'bg-gray-100 text-gray-800 border-gray-200',
      'COMEDY': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CONCERT': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'THEATRE': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return colors[type?.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.eventDate || event.date) >= new Date()
  );
  
  const pastEvents = filteredEvents.filter(event => 
    new Date(event.eventDate || event.date) < new Date()
  );

  return (
    <section 
      id="events" 
      ref={ref}
      className="min-h-screen py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #0d1d35 0%, #00274c 50%, #1a2c45 100%)`,
      }}
    >
      {/* Floating Background Shapes */}
      <FloatingShapes variant="default" opacity={0.05} />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="heading-primary text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 sm:mb-6">
            EVENTS
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "160px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto mb-6 sm:mb-8"
          />
          <p className="body-text text-base sm:text-lg md:text-xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
            Where innovation happens. Join us for immersive experiences that shape the future of AI in business.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['all', 'upcoming', 'past'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  selectedFilter === filter
                    ? 'bg-white text-[#00274c] shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }`}
              >
                {filter} Events
              </button>
            ))}
          </div>

          {/* Event Type Filters */}
          {eventTypes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedType === 'all'
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }`}
              >
                All Types
              </button>
              {eventTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type || '')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedType === type
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Events Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#BBBBBB]">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#BBBBBB] text-xl">No events found.</p>
            <p className="text-[#5e6472] mt-2">
              {searchQuery ? 'Try adjusting your search terms.' : 'Add events through the admin panel.'}
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming Events Section */}
            {selectedFilter !== 'past' && upcomingEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-16"
              >
                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                  {selectedFilter === 'upcoming' ? 'Upcoming Events' : 'Coming Up'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="wait">
                    {upcomingEvents.map((event, index) => {
                      const eventDate = formatEventDate(event);
                      const eventSlug = event.slug || generateSlug(event.title);
                      
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -30 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="group"
                        >
                          <Link href={`/events/${eventSlug}`} className="block">
                            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
                              {/* Event Image */}
                              {event.imageUrl && (
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  
                                  {/* Date Badge */}
                                  <div className="absolute top-4 left-4 bg-white rounded-lg p-3 text-center shadow-lg">
                                    <div className="text-2xl font-bold text-gray-900">{eventDate.day}</div>
                                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">{eventDate.month}</div>
                                  </div>
                                </div>
                              )}

                              {/* Event Content */}
                              <div className="p-6">
                                {/* Event Type Badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.eventType || event.type || '')}`}>
                                    {event.eventType || event.type || 'EVENT'}
                                  </span>
                                  <span className="text-sm text-gray-500">{eventDate.time}</span>
                                </div>

                                {/* Event Title */}
                                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#00274c] transition-colors">
                                  {event.title}
                                </h4>

                                {/* Event Description */}
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                  {event.description}
                                </p>

                                {/* Event Details */}
                                <div className="space-y-2 text-xs text-gray-500">
                                  {event.location && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.venue && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      <span>{event.venue}</span>
                                    </div>
                                  )}
                                  {(event.capacity || event.maxAttendees) && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                      </svg>
                                      <span>{event.capacity || event.maxAttendees} spots</span>
                                    </div>
                                  )}
                                </div>

                                {/* CTA Button */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-[#00274c] group-hover:text-[#003366]">
                                      View Details
                                    </span>
                                    <svg className="w-4 h-4 text-[#00274c] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Past Events Section */}
            {selectedFilter !== 'upcoming' && pastEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mb-16"
              >
                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                  {selectedFilter === 'past' ? 'Past Events' : 'Recently Completed'}
                </h3>
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {pastEvents.slice(0, 6).map((event, index) => {
                      const eventDate = formatEventDate(event);
                      const eventSlug = event.slug || generateSlug(event.title);
                      
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="group"
                        >
                          <Link href={`/events/${eventSlug}`} className="block">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 transform group-hover:scale-[1.02]">
                              <div className="flex items-center gap-6">
                                {/* Date Column */}
                                <div className="flex-shrink-0 text-center">
                                  <div className="w-16 h-16 bg-white/10 rounded-xl flex flex-col items-center justify-center border border-white/20">
                                    <div className="text-xl font-bold text-white">{eventDate.day}</div>
                                    <div className="text-xs text-white/80 uppercase tracking-wide">{eventDate.month}</div>
                                  </div>
                                </div>

                                {/* Event Content */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-white/10 text-white/80 text-xs font-medium rounded-full border border-white/20">
                                      {event.eventType || event.type || 'EVENT'}
                                    </span>
                                    <span className="text-sm text-white/60">{eventDate.time}</span>
                                  </div>
                                  
                                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors">
                                    {event.title}
                                  </h4>
                                  
                                  <p className="text-white/70 text-sm mb-2 line-clamp-1">
                                    {event.description}
                                  </p>
                                  
                                  {event.location && (
                                    <div className="flex items-center gap-2 text-white/60 text-xs">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Event Image */}
                                {event.imageUrl && (
                                  <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden">
                                    <img
                                      src={event.imageUrl}
                                      alt={event.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                
                {pastEvents.length > 6 && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setSelectedFilter('past')}
                      className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      View All Past Events ({pastEvents.length})
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="heading-secondary text-2xl md:text-3xl text-white mb-4">
              SHAPE THE CONVERSATION
            </h3>
            <p className="body-text text-[#BBBBBB] mb-6 leading-relaxed">
              Have an idea for our next event? Want to speak or sponsor? Let's build something meaningful together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/#join" className="btn-primary">
                Propose an Event
              </a>
              <a href="mailto:ABGPartnerships@umich.edu" className="btn-secondary">
                Partner With Us
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}