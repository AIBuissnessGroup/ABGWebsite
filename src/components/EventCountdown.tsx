'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { analytics } from '@/lib/analytics';

// Helper function to format dates in ET timezone
const formatDateInET = (date: Date, format: 'date' | 'time' | 'datetime' = 'datetime'): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/New_York'
  };

  if (format === 'date') {
    return date.toLocaleDateString('en-US', {
      ...options,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } else if (format === 'time') {
    return date.toLocaleTimeString('en-US', {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    // datetime format
    return `📅 ${date.toLocaleDateString('en-US', {
      ...options,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })}
${date.toLocaleTimeString('en-US', {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })} ET`;
  }
};

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  venue?: string;
  registrationUrl?: string;
  registrationEnabled?: boolean;
  registrationCtaLabel?: string;
  partnerships?: any[];
  slug?: string;
  subevents?: {
    id: string;
    title: string;
    description: string;
    eventDate: string;
    venue?: string;
    eventType: string;
  }[];
}

interface EventCountdownProps {
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventDescription?: string;
}

export default function EventCountdown({ 
  eventName = "AI in Business Symposium",
  eventDate = "2025-02-15T18:00:00",
  eventLocation = "Michigan Ross School of Business",
  eventDescription = "Join us for an exclusive evening exploring the future of AI in business"
}: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isClient, setIsClient] = useState(false);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventAttendanceText, setEventAttendanceText] = useState('Open to all students');

  // Function to generate Google Calendar URL
    const generateGoogleCalendarUrl = (event: Event) => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const params = new URLSearchParams({
      text: event.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `${event.description}\n\nOrganized by AI Business Group - University of Michigan`,
      location: event.location || 'University of Michigan',
      sprop: 'website:abg-umich.com'
    });
    
    return `${baseUrl}&${params.toString()}`;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Load next upcoming event and settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load event and settings in parallel
        const [eventRes, settingsRes] = await Promise.all([
          fetch('/api/events/next'),
          fetch('/api/admin/settings')
        ]);

        if (eventRes.ok) {
          const event = await eventRes.json();
          setNextEvent(event);
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const attendanceTextSetting = settings.find((s: any) => s.key === 'event_attendance_text');
          if (attendanceTextSetting) {
            setEventAttendanceText(attendanceTextSetting.value);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingEvent(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setIsClient(true);
    
    const calculateTimeLeft = () => {
      const targetDate = nextEvent?.eventDate || eventDate;
      
      // Create date object and ensure we're working with proper timezone
      let eventDateTime;
      if (targetDate.includes('T') && !targetDate.includes('Z') && !targetDate.includes('+')) {
        // If it's an ISO string without timezone info, treat as local time
        eventDateTime = new Date(targetDate);
      } else {
        // Otherwise parse normally
        eventDateTime = new Date(targetDate);
      }
      
      const now = new Date();
      const difference = eventDateTime.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, nextEvent]);

  if (!isClient) {
    return (
      <div className="w-full max-w-sm mx-auto lg:max-w-none">
        <div className="glass-card p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
          <div className="animate-pulse text-muted">Loading event...</div>
        </div>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ];

  return (
    <div className="w-full max-w-sm mx-auto lg:max-w-none">
      <div className="glass-card p-3 sm:p-4 lg:p-6 min-h-[400px] sm:min-h-[480px] lg:min-h-[600px] flex flex-col relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-3 sm:w-4 h-3 sm:h-4 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-2 sm:w-3 h-2 sm:h-3 border border-white/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 border border-white/5 rounded-full"></div>

      {/* Event Header */}
      <div className="text-center space-y-1 sm:space-y-2 relative z-10 mb-2 sm:mb-3 lg:mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 text-muted text-xs sm:text-sm"
        >
          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="uppercase tracking-wider">Next Event</span>
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white text-sm sm:text-base lg:text-lg xl:text-xl font-bold leading-tight px-2"
        >
          {nextEvent?.title || eventName}
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted text-xs sm:text-sm leading-snug mx-auto px-2 line-clamp-3"
        >
          {(nextEvent?.description || eventDescription).length > 100 ? 
            (nextEvent?.description || eventDescription).substring(0, 100) + '...' : 
            (nextEvent?.description || eventDescription)
          }
        </motion.p>

        {/* Upcoming Subevents */}
        {nextEvent?.subevents && nextEvent.subevents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="pt-1 sm:pt-2"
          >
            <div className="text-xs text-muted mb-1 sm:mb-2 uppercase tracking-wider">Pre-Event</div>
            <div className="px-1 sm:px-2">
              {nextEvent.subevents.slice(0, 1).map((subevent, idx) => (
                <div key={subevent.id} className="flex items-center justify-between p-1.5 sm:p-2 bg-white/5 rounded border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-white text-xs font-medium truncate">{subevent.title}</span>
                      <span className={`px-1 py-0.5 rounded text-xs flex-shrink-0 ${
                        subevent.eventType === 'WORKSHOP' ? 'bg-green-400/20 text-green-400' :
                        'bg-blue-400/20 text-blue-400'
                      }`}>
                        {subevent.eventType}
                      </span>
                    </div>
                    <div className="text-muted text-xs">
                      {formatDateInET(new Date(subevent.eventDate))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Countdown Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="grid grid-cols-4 gap-1 sm:gap-2 relative z-10 py-2 sm:py-3 my-1 sm:my-2"
      >
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            className="text-center"
          >
            <div className="bg-brand sm:bg-white/10 backdrop-blur-sm border border-white/20 rounded p-1.5 sm:p-2 lg:p-3 mb-1">
              <motion.div
                key={unit.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-white"
              >
                {unit.value.toString().padStart(2, '0')}
              </motion.div>
            </div>
            <div className="text-xs text-muted uppercase tracking-wider">
              {unit.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Event Partners - Below Countdown */}
      {nextEvent?.partnerships && nextEvent.partnerships.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="relative z-10 py-2 sm:py-3 flex-shrink-0"
        >
          <div className="text-center mb-2 sm:mb-3">
            <div className="text-xs sm:text-sm text-white font-medium uppercase tracking-wider">Event Partners</div>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 px-1 sm:px-2">
            {nextEvent.partnerships.map((partnership: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 rounded border border-white/20 hover:bg-white/15 transition-all duration-200">
                {partnership.company.logoUrl && (
                  <img 
                    src={partnership.company.logoUrl} 
                    alt={partnership.company.name}
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span className="text-white text-xs sm:text-sm font-medium">{partnership.company.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Event Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="space-y-1 sm:space-y-2 relative z-10 mt-auto pt-2 sm:pt-3"
      >
        {/* Location and Venue */}
        <div className="text-center space-y-0.5">
          <div className="flex items-center justify-center gap-2 text-muted text-xs">
            <MapPinIcon className="w-3 h-3" />
            <span className="text-center font-medium">{nextEvent?.location || eventLocation}</span>
          </div>
          {nextEvent?.venue && (
            <div className="text-white/80 text-xs font-medium">
              📍 {nextEvent.venue}
            </div>
          )}
        </div>
        
        {/* Event Date */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted text-xs">
            <CalendarIcon className="w-3 h-3" />
            <span>
              {nextEvent?.eventDate ? 
                formatDateInET(new Date(nextEvent.eventDate)) : 
                formatDateInET(new Date(eventDate))
              }
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-muted text-xs">
          <UserGroupIcon className="w-3 h-3" />
          <span>{eventAttendanceText}</span>
        </div>
        
        <div className="text-center pt-1 sm:pt-2 pb-1">
          <div className="flex flex-col gap-1 sm:gap-2 justify-center items-center">
            {nextEvent && (
              <motion.a
                href={`/events/${nextEvent.slug || generateSlug(nextEvent.title)}`}
                onClick={() => {
                  analytics.events.viewEvent(nextEvent.title);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-brand hover-brand backdrop-blur-sm border border-white/30 rounded px-3 py-2 text-white text-xs sm:text-sm font-medium transition-all duration-300 text-center"
              >
                Event Details
              </motion.a>
            )}

            {nextEvent?.registrationEnabled && (
              <motion.a
                href={nextEvent?.registrationUrl || "/events"}
                onClick={() => {
                  if (nextEvent) {
                    analytics.events.clickRegister(nextEvent.title);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-brand hover-brand backdrop-blur-sm border border-white/30 rounded px-3 py-2 text-white text-xs sm:text-sm font-medium transition-all duration-300 text-center"
              >
                {nextEvent?.registrationCtaLabel || 'Reserve Your Spot →'}
              </motion.a>
            )}
          
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
} 