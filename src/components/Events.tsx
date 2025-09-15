'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSession } from 'next-auth/react'
import FloatingShapes from './FloatingShapes'

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
  type?: string;
  maxAttendees?: number;
  registrationRequired: boolean;
  imageUrl?: string;
  featured: boolean;
  published: boolean;
  attendanceConfirmEnabled?: number;
  slug?: string;
}

export default function Events() {
  const { data: session } = useSession()
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceModal, setAttendanceModal] = useState<{ show: boolean; event: any }>({ show: false, event: null })
  const [attendancePassword, setAttendancePassword] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: { attended: boolean; confirmedAt?: string } }>({})
  const [registrationStatus, setRegistrationStatus] = useState<{ [key: string]: { registered: boolean; status: string; registeredAt?: string } }>({})
  const [eventRequirements, setEventRequirements] = useState<{ [key: string]: { requiresPassword: boolean } }>({})
  const [submittingAttendance, setSubmittingAttendance] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  // Helper function to generate URL-friendly slugs
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Function to generate Google Calendar URL
  const generateGoogleCalendarUrl = (event: any) => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ format)
    const startDate = new Date(event.eventDate || event.date)
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // Default 2 hours duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    const params = new URLSearchParams({
      text: event.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `${event.description}\n\n${event.partnerships && event.partnerships.length > 0 ? 
        'Event Partners: ' + event.partnerships.map((p: any) => p.company.name).join(', ') + '\n\n' : ''
      }Organized by AI Business Group - University of Michigan`,
      location: event.location || event.venue || 'University of Michigan',
      sprop: 'website:abg-umich.com'
    })
    
    return `${baseUrl}&${params.toString()}`
  }

  // Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          
          // Load attendance status for authenticated users
          if (session?.user) {
            await loadAttendanceStatus(data);
            await loadRegistrationStatus(data);
          }
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [session]);

  // Load attendance status for events
  const loadAttendanceStatus = async (eventList: any[]) => {
    if (!session?.user) return;
    
    try {
      const statusPromises = eventList
        .filter(event => event.attendanceConfirmEnabled)
        .map(async (event) => {
          const res = await fetch(`/api/events/${event.id}/attendance/confirm`);
          if (res.ok) {
            const status = await res.json();
            return { eventId: event.id, status };
          }
          return null;
        });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap: { [key: string]: any } = statuses.reduce((acc, item) => {
        if (item) {
          acc[item.eventId] = item.status;
        }
        return acc;
      }, {} as { [key: string]: any });
      
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Failed to load attendance status:', error);
    }
  };

  // Load registration status for all events
  const loadRegistrationStatus = async (eventList: any[]) => {
    if (!session?.user) return;
    
    try {
      const statusPromises = eventList
        .filter(event => event.registrationEnabled || event.attendanceConfirmEnabled)
        .map(async (event) => {
          try {
            const res = await fetch(`/api/events/${event.id}/registration/status`);
            if (res.ok) {
              const status = await res.json();
              return { eventId: event.id, status };
            }
          } catch (err) {
            console.error(`Failed to load registration status for event ${event.id}:`, err);
          }
          return { eventId: event.id, status: { registered: false } };
        });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap: { [key: string]: any } = statuses.reduce((acc, item) => {
        if (item) {
          acc[item.eventId] = item.status;
        }
        return acc;
      }, {} as { [key: string]: any });
      
      setRegistrationStatus(statusMap);
    } catch (error) {
      console.error('Failed to load registration status:', error);
    }
  };

  // Handle attendance confirmation
  const handleAttendanceConfirm = async () => {
    if (!attendanceModal.event) return;
    
    const requiresPassword = eventRequirements[attendanceModal.event.id]?.requiresPassword;
    if (requiresPassword && !attendancePassword.trim()) return;
    
    setSubmittingAttendance(true);
    try {
      const res = await fetch(`/api/events/${attendanceModal.event.id}/attendance/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: attendancePassword || '' })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setAttendanceStatus(prev => ({
          ...prev,
          [attendanceModal.event.id]: { attended: true, confirmedAt: result.confirmedAt }
        }));
        setAttendanceModal({ show: false, event: null });
        setAttendancePassword('');
        alert('Attendance confirmed successfully!');
      } else {
        alert(result.error || 'Failed to confirm attendance');
      }
    } catch (error) {
      console.error('Failed to confirm attendance:', error);
      alert('Error confirming attendance');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const openAttendanceModal = async (event: any) => {
    if (!session?.user) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/events')}`;
      return;
    }
    
    // Load event requirements
    try {
      const res = await fetch(`/api/events/${event.id}/requirements`);
      if (res.ok) {
        const requirements = await res.json();
        setEventRequirements(prev => ({
          ...prev,
          [event.id]: { requiresPassword: requirements.requiresPassword }
        }));
      }
    } catch (error) {
      console.error('Failed to load event requirements:', error);
    }
    
    setAttendanceModal({ show: true, event });
    setAttendancePassword('');
  };  return (
    <section 
      id="events" 
      ref={ref}
      className="min-h-screen py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #0d1d35 0%, #00274c 50%, #1a2c45 100%)`,
      }}
    >
      {/* Floating Background Shapes */}
      <FloatingShapes variant="default" opacity={0.07} />

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ 
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-32 right-20 w-64 h-64 border border-white/5 rounded-full"
        />
        <motion.div
          animate={{ 
            rotate: [360, 180, 0],
          }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-20 left-32 w-48 h-48 border border-white/3 rounded-lg"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="heading-primary text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6">
            EVENTS
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "160px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto mb-6 sm:mb-8"
          />
          <p className="body-text text-base sm:text-lg md:text-xl lg:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
            Where innovation happens. Join us for immersive experiences that shape the future of AI in business.
          </p>
        </motion.div>

        {/* Timeline Layout */}
        <div className="relative px-2 sm:px-0">
          {/* Timeline Line - Hidden on mobile */}
          <div className="hidden md:block absolute left-6 sm:left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#BBBBBB] via-[#5e6472] to-[#BBBBBB] transform md:-translate-x-0.5"></div>

          {/* Events */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-[#BBBBBB]">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#BBBBBB] text-xl">No events found.</p>
              <p className="text-[#5e6472] mt-2">Add events through the admin panel.</p>
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-12 md:space-y-16">
              {events.map((event: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 + (index * 0.2) }}
                className={`relative flex flex-col md:flex-row items-start ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline Dot - Hidden on mobile */}
                <div className="hidden md:block absolute left-6 sm:left-8 md:left-1/2 w-4 h-4 bg-white border-4 border-[#00274c] rounded-full transform -translate-x-2 z-10 ripple-effect"></div>

                {/* Event Card */}
                <div className={`px-4 sm:px-6 md:pl-0 md:pr-0 md:w-5/12 ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-12' : 'md:ml-auto md:pl-12'
                }`}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => setSelectedEvent(selectedEvent === index ? null : index)}
                    className="glass-card p-4 sm:p-6 md:p-8 cursor-pointer glow-on-hover relative overflow-hidden"
                  >
                    {/* Background Image */}
                    {event.imageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-5 hover:opacity-10 transition-opacity duration-300"
                        style={{ backgroundImage: `url(${event.imageUrl})` }}
                      />
                    )}
                    {/* Event Header */}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-[#5e6472] text-white text-xs uppercase tracking-wider rounded-full">
                            {event.eventType || event.type}
                          </span>
                          <span className="text-[#BBBBBB] text-sm">
                            {event.capacity || event.maxAttendees ? `${event.capacity || event.maxAttendees} max` : 'Open'}
                          </span>
                          {event.subevents && event.subevents.length > 0 && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              {event.subevents.length} subevents
                            </span>
                          )}
                          {event.attendanceConfirmEnabled && attendanceStatus[event.id]?.attended && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full flex items-center gap-1">
                              ✓ Confirmed
                            </span>
                          )}
                          {registrationStatus[event.id]?.registered && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
                              🎟️ {registrationStatus[event.id]?.status === 'waitlisted' ? 'Waitlisted' : 'Registered'}
                            </span>
                          )}
                        </div>
                        <h3 className="heading-secondary text-xl md:text-2xl text-white mb-2">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3 mb-4 relative z-10">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#BBBBBB] text-xs sm:text-sm">
                        <span>📅 {convertUtcToEst(new Date(event.eventDate || event.date)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</span>
                        {(event.time || event.eventDate) && <span>🕔 {event.time || convertUtcToEst(new Date(event.eventDate)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} EST</span>}
                        {event.location && <span>📍 {event.location}</span>}
                        {event.venue && <span>🏢 {event.venue}</span>}
                      </div>
                      <p className="body-text text-[#BBBBBB] leading-relaxed">
                        {event.description}
                      </p>
                      
                      {/* Event Partnerships - Visible on main card */}
                      {event.partnerships && event.partnerships.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-white font-semibold mb-2 text-sm">Event Partners</h4>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {event.partnerships.map((partnership: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/10 rounded-full border border-white/20">
                                {partnership.company.logoUrl && (
                                  <img 
                                    src={partnership.company.logoUrl} 
                                    alt={partnership.company.name}
                                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-white text-xs sm:text-sm font-medium">{partnership.company.name}</span>
                                <span className={`hidden sm:inline px-2 py-1 rounded-full text-xs ${
                                  partnership.type === 'SPONSOR' ? 'bg-purple-400/30 text-purple-300' :
                                  partnership.type === 'COLLABORATOR' ? 'bg-green-400/30 text-green-300' :
                                  partnership.type === 'MENTOR' ? 'bg-blue-400/30 text-blue-300' :
                                  'bg-gray-400/30 text-gray-300'
                                }`}>
                                  {partnership.type}
                                </span>
                                {partnership.sponsorshipLevel && (
                                  <span className="hidden sm:inline bg-yellow-400/30 text-yellow-300 px-2 py-1 rounded-full text-xs">
                                    {partnership.sponsorshipLevel}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Indicator */}
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex gap-2">
                        <a
                          href={`/events/${event.slug || generateSlug(event.title)}`}
                          className="btn-primary text-xs sm:text-sm px-4 sm:px-6 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details
                        </a>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="btn-secondary text-xs sm:text-sm px-4 sm:px-6 py-2"
                        >
                          {selectedEvent === index ? 'Show Less' : 'See What\'s Possible'}
                        </motion.button>
                      </div>
                      
                      <motion.div
                        animate={{ rotate: selectedEvent === index ? 180 : 0 }}
                        className="w-6 h-6 text-[#BBBBBB] flex-shrink-0"
                      >
                        ↓
                      </motion.div>
                    </div>

                    {/* Expanded Details */}
                    {selectedEvent === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 pt-6 border-t border-[#5e6472]/30"
                      >
                        <p className="body-text text-[#BBBBBB] leading-relaxed mb-4">
                          {event.description}
                        </p>
                        
                        {/* Subevents Section */}
                        {event.subevents && event.subevents.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-white font-semibold mb-3 text-sm">Event Schedule</h4>
                            <div className="space-y-3">
                              {event.subevents.map((subevent: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-1">
                                      <h5 className="text-white text-sm font-medium">{subevent.title}</h5>
                                      <span className={`px-2 py-1 rounded text-xs ml-2 ${
                                        subevent.eventType === 'WORKSHOP' ? 'bg-green-400/20 text-green-400' :
                                        subevent.eventType === 'NETWORKING' ? 'bg-blue-400/20 text-blue-400' :
                                        subevent.eventType === 'MEETING' ? 'bg-purple-400/20 text-purple-400' :
                                        'bg-gray-400/20 text-gray-400'
                                      }`}>
                                        {subevent.eventType}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[#BBBBBB] text-xs mb-2">
                                      <span>📅 {convertUtcToEst(new Date(subevent.eventDate)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</span>
                                      <span>🕔 {convertUtcToEst(new Date(subevent.eventDate)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} EST</span>
                                      {subevent.venue && <span>🏢 {subevent.venue}</span>}
                                      {subevent.capacity && <span>👥 {subevent.capacity}</span>}
                                    </div>
                                    <p className="text-[#BBBBBB] text-xs">{subevent.description}</p>
                                    
                                    {/* Subevent Partnerships */}
                                    {subevent.partnerships && subevent.partnerships.length > 0 && (
                                      <div className="mt-2">
                                        <div className="flex flex-wrap gap-1">
                                          {subevent.partnerships.map((partnership: any, pidx: number) => (
                                            <span key={pidx} className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                                              {partnership.company.name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Partnership Details - Show more detailed info in expanded view */}
                        {event.partnerships && event.partnerships.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-white font-semibold mb-3 text-sm">Partnership Details</h4>
                            <div className="space-y-3">
                              {event.partnerships.map((partnership: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                  {partnership.company.logoUrl && (
                                    <img 
                                      src={partnership.company.logoUrl} 
                                      alt={partnership.company.name}
                                      className="w-8 h-8 object-contain mt-1"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-white text-sm font-medium">{partnership.company.name}</span>
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        partnership.type === 'SPONSOR' ? 'bg-purple-400/20 text-purple-400' :
                                        partnership.type === 'COLLABORATOR' ? 'bg-green-400/20 text-green-400' :
                                        partnership.type === 'MENTOR' ? 'bg-blue-400/20 text-blue-400' :
                                        'bg-gray-400/20 text-gray-400'
                                      }`}>
                                        {partnership.type}
                                      </span>
                                      {partnership.sponsorshipLevel && (
                                        <span className="bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded text-xs">
                                          {partnership.sponsorshipLevel}
                                        </span>
                                      )}
                                    </div>
                                    {partnership.description && (
                                      <p className="text-[#BBBBBB] text-xs">{partnership.description}</p>
                                    )}
                                    {partnership.company.website && (
                                      <a
                                        href={partnership.company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[#BBBBBB] hover:text-white text-xs mt-1 transition-colors"
                                      >
                                        <span>Visit Website</span>
                                        <span>→</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href={`/events/${event.slug || generateSlug(event.title)}`}
                            className="btn-primary text-sm px-6 py-2 text-center"
                          >
                            View Event Details
                          </a>
                          {event.registrationEnabled && (
                            <a
                              href={event.registrationUrl || '/#join'}
                              className="btn-secondary text-sm px-6 py-2"
                            >
                              {event.registrationCtaLabel || 'Reserve Your Spot'}
                            </a>
                          )}
                          <a 
                            href={generateGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm px-6 py-2"
                          >
                            Add to Calendar
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
                            ))}
              </div>
            )}
          </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
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

      {/* Attendance Confirmation Modal */}
      {attendanceModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#00274c] border border-white/20 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Confirm Attendance
            </h3>
            
            {attendanceModal.event && (
              <div className="mb-6">
                <h4 className="text-white font-semibold">{attendanceModal.event.title}</h4>
                <div className="text-[#BBBBBB] text-sm mt-2 space-y-1">
                  <div>📅 {convertUtcToEst(new Date(attendanceModal.event.eventDate)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</div>
                  <div>🕔 {convertUtcToEst(new Date(attendanceModal.event.eventDate)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} EST</div>
                  {attendanceModal.event.location && <div>📍 {attendanceModal.event.location}</div>}
                  {attendanceModal.event.venue && <div>🏢 {attendanceModal.event.venue}</div>}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {eventRequirements[attendanceModal.event?.id]?.requiresPassword && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Event Password
                  </label>
                  <input
                    type="password"
                    value={attendancePassword}
                    onChange={(e) => setAttendancePassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="Enter event password"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && (attendancePassword.trim() || !eventRequirements[attendanceModal.event?.id]?.requiresPassword)) {
                        handleAttendanceConfirm();
                      }
                    }}
                  />
                </div>
              )}

              {!eventRequirements[attendanceModal.event?.id]?.requiresPassword && (
                <div className="text-[#BBBBBB] text-sm">
                  No password required for this event. Click confirm to mark your attendance.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setAttendanceModal({ show: false, event: null })}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  disabled={submittingAttendance}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttendanceConfirm}
                  disabled={(eventRequirements[attendanceModal.event?.id]?.requiresPassword && !attendancePassword.trim()) || submittingAttendance}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingAttendance ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  )
}
