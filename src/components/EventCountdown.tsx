'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { analytics } from '@/lib/analytics';

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  venue?: string;
  registrationUrl?: string;
  partnerships?: any[];
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
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ format)
    const startDate = new Date(event.eventDate)
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
      const difference = +new Date(targetDate) - +new Date();
      
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
      <div className="glass-card p-6 sm:p-12 h-[650px] sm:h-[700px] lg:h-[750px] flex items-center justify-center">
        <div className="animate-pulse text-[#BBBBBB]">Loading event...</div>
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
    <div className="glass-card p-4 sm:p-6 lg:p-8 h-[650px] sm:h-[700px] lg:h-[750px] flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-6 sm:w-10 h-6 sm:h-10 border border-white/20 rounded-full"></div>
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 w-4 sm:w-8 h-4 sm:h-8 border border-white/10 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 border border-white/5 rounded-full"></div>

      {/* Event Header */}
      <div className="text-center space-y-2 sm:space-y-3 lg:space-y-4 relative z-10 mb-4 sm:mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 text-[#BBBBBB] text-sm sm:text-base"
        >
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="uppercase tracking-wider">Next Event</span>
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white text-lg sm:text-xl lg:text-2xl font-bold leading-tight px-2 sm:px-4"
        >
          {nextEvent?.title || eventName}
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[#BBBBBB] text-xs sm:text-sm leading-snug max-w-xs sm:max-w-sm mx-auto px-2 sm:px-4"
        >
          {nextEvent?.description || eventDescription}
        </motion.p>

        {/* Event Partners */}
        {nextEvent?.partnerships && nextEvent.partnerships.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-2"
          >
            <div className="text-xs text-[#BBBBBB] mb-2 uppercase tracking-wider font-medium">Event Partners</div>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 px-2">
              {nextEvent.partnerships.slice(0, 3).map((partnership: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1 bg-white/10 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-200">
                  {partnership.company.logoUrl && (
                    <img 
                      src={partnership.company.logoUrl} 
                      alt={partnership.company.name}
                      className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-white text-xs font-medium truncate max-w-20 sm:max-w-none">{partnership.company.name}</span>
                  {partnership.sponsorshipLevel && (
                    <span className="hidden sm:inline bg-yellow-400/30 text-yellow-300 px-1 py-0.5 rounded text-xs">
                      {partnership.sponsorshipLevel}
                    </span>
                  )}
                </div>
              ))}
              {nextEvent.partnerships.length > 3 && (
                <span className="text-xs text-[#BBBBBB] px-2 py-1">+{nextEvent.partnerships.length - 3} more</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Upcoming Subevents */}
        {nextEvent?.subevents && nextEvent.subevents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="pt-1"
          >
            <div className="text-xs text-[#BBBBBB] mb-2 uppercase tracking-wider">Event Schedule</div>
            <div className="space-y-1 px-2">
              {nextEvent.subevents.slice(0, 1).map((subevent, idx) => (
                <div key={subevent.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-xs font-medium truncate">{subevent.title}</span>
                      <span className={`px-1 py-0.5 rounded text-xs flex-shrink-0 ${
                        subevent.eventType === 'WORKSHOP' ? 'bg-green-400/20 text-green-400' :
                        subevent.eventType === 'NETWORKING' ? 'bg-blue-400/20 text-blue-400' :
                        subevent.eventType === 'MEETING' ? 'bg-purple-400/20 text-purple-400' :
                        'bg-gray-400/20 text-gray-400'
                      }`}>
                        {subevent.eventType}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[#BBBBBB] text-xs">
                      <span>📅 {new Date(subevent.eventDate).toLocaleDateString()}</span>
                      <span>🕔 {new Date(subevent.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
              {nextEvent.subevents.length > 1 && (
                <div className="text-center">
                  <span className="text-[#BBBBBB] text-xs">
                    +{nextEvent.subevents.length - 1} more sessions
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Countdown Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10 py-4 sm:py-5 my-3 sm:my-4"
      >
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded p-2 sm:p-3 mb-1 sm:mb-2">
              <motion.div
                key={unit.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-base sm:text-lg lg:text-xl font-bold text-white"
              >
                {unit.value.toString().padStart(2, '0')}
              </motion.div>
            </div>
            <div className="text-xs text-[#BBBBBB] uppercase tracking-wider">
              {unit.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Event Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="space-y-2 sm:space-y-3 relative z-10 mt-auto"
      >
        {/* Location and Venue */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-[#BBBBBB] text-xs sm:text-sm">
            <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center font-medium">{nextEvent?.location || eventLocation}</span>
          </div>
          {nextEvent?.venue && (
            <div className="text-[#5e6472] text-xs">
              📍 {nextEvent.venue}
            </div>
          )}
        </div>
        
        {/* Event Date */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-[#BBBBBB] text-xs sm:text-sm">
            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>
              {nextEvent?.eventDate ? 
                new Date(nextEvent.eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 
                new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
              }
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-[#BBBBBB] text-xs sm:text-sm">
          <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{eventAttendanceText}</span>
        </div>
        
        <div className="text-center pt-2 sm:pt-3 pb-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
            <motion.a
              href={nextEvent?.registrationUrl || "/events"}
              onClick={() => {
                if (nextEvent) {
                  analytics.events.clickRegister(nextEvent.title);
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded px-4 sm:px-5 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-medium transition-all duration-300 text-center"
            >
              {nextEvent?.registrationUrl ? 'Register Now →' : 'Learn More →'}
            </motion.a>
            
            {nextEvent && (
              <motion.a
                href={generateGoogleCalendarUrl(nextEvent)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => analytics.events.addToCalendar(nextEvent.title)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded px-4 sm:px-5 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-medium transition-all duration-300 text-center"
              >
                Add to Calendar
              </motion.a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 