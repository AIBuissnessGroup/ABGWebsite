'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  venue?: string;
  registrationUrl?: string;
  partnerships?: any[];
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

  // Load next upcoming event
  useEffect(() => {
    const loadNextEvent = async () => {
      try {
        const res = await fetch('/api/events/next');
        if (res.ok) {
          const event = await res.json();
          setNextEvent(event);
        }
      } catch (error) {
        console.error('Failed to load next event:', error);
      } finally {
        setLoadingEvent(false);
      }
    };

    loadNextEvent();
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
      <div className="glass-card p-6 sm:p-12 h-[500px] sm:h-[600px] lg:h-[650px] flex items-center justify-center">
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
    <div className="glass-card p-4 sm:p-6 lg:p-8 h-[500px] sm:h-[600px] lg:h-[650px] flex flex-col justify-between relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-6 sm:w-10 h-6 sm:h-10 border border-white/20 rounded-full"></div>
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 w-4 sm:w-8 h-4 sm:h-8 border border-white/10 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 border border-white/5 rounded-full"></div>

      {/* Event Header */}
      <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 text-[#BBBBBB] text-xs sm:text-sm"
        >
          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="uppercase tracking-wider">Next Event</span>
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white text-lg sm:text-xl lg:text-2xl font-bold leading-tight px-2"
        >
          {nextEvent?.title || eventName}
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[#5e6472] text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md mx-auto px-2"
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
            <div className="text-xs text-[#BBBBBB] mb-2 sm:mb-3 uppercase tracking-wider">Event Partners</div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
              {nextEvent.partnerships.map((partnership: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-white/10 rounded-full border border-white/20">
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
                  <span className="text-white text-xs font-medium">{partnership.company.name}</span>
                  {partnership.sponsorshipLevel && (
                    <span className="bg-yellow-400/30 text-yellow-300 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ml-0.5 sm:ml-1">
                      {partnership.sponsorshipLevel}
                    </span>
                  )}
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
        className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 relative z-10 py-2 sm:py-4"
      >
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 sm:p-3 lg:p-4 mb-2 sm:mb-3">
              <motion.div
                key={unit.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-lg sm:text-xl lg:text-2xl font-bold text-white"
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
        className="space-y-3 sm:space-y-4 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 text-[#BBBBBB] text-xs sm:text-sm">
          <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-center">{nextEvent?.location || eventLocation}</span>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-[#BBBBBB] text-xs sm:text-sm">
          <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Open to all students</span>
        </div>
        
        <div className="text-center pt-2 space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center">
            <motion.a
              href={nextEvent?.registrationUrl || "/events"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-4 sm:px-6 py-2 text-white text-xs sm:text-sm font-medium transition-all duration-300 text-center"
            >
              {nextEvent?.registrationUrl ? 'Register Now →' : 'Learn More →'}
            </motion.a>
            
            {nextEvent && (
              <motion.a
                href={generateGoogleCalendarUrl(nextEvent)}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-4 sm:px-6 py-2 text-white text-xs sm:text-sm font-medium transition-all duration-300 text-center"
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