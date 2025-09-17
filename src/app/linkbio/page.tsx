'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InstagramIcon, XIcon, LinkedInIcon } from '@/components/SocialIcons';
import { CalendarDaysIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate: string;
  location?: string;
  capacity?: number;
  registrationEnabled: boolean;
  published: boolean;
  featured?: boolean;
  eventType?: string;
}

export default function LinkBioPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        // Filter for published events with registration enabled and sort by date
        const upcomingEvents = data
          .filter((event: Event) => 
            event.published && 
            event.registrationEnabled && 
            new Date(event.eventDate) >= new Date()
          )
          .sort((a: Event, b: Event) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        setEvents(upcomingEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/umichaibusiness/',
      icon: InstagramIcon,
      color: 'from-pink-500 to-purple-600'
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/michigan-ai-business-group',
      icon: LinkedInIcon,
      color: 'from-blue-600 to-blue-700'
    },
    {
      name: 'X (Twitter)',
      href: 'https://x.com/AiBusinessUmich',
      icon: XIcon,
      color: 'from-gray-800 to-black'
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'WORKSHOP': return 'from-blue-500 to-blue-600';
      case 'SYMPOSIUM': return 'from-purple-500 to-purple-600';
      case 'NETWORKING': return 'from-green-500 to-green-600';
      case 'COMPETITION': return 'from-red-500 to-red-600';
      case 'RECRUITMENT': return 'from-yellow-500 to-yellow-600';
      default: return 'from-[#00274c] to-blue-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] via-[#003366] to-[#001a33] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] via-[#003366] to-[#001a33] py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            AI Business Group
          </h1>
          <p className="text-[#BBBBBB] text-sm leading-relaxed">
            University of Michigan
          </p>
          <p className="text-[#BBBBBB] text-xs mt-1">
            Building the future with AI
          </p>
        </motion.div>

        {/* Events Section */}
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-white font-semibold text-lg mb-4 text-center">
              Events with Open Registration
            </h2>
            <div className="space-y-3">
              {events.map((event, index) => (
                <motion.a
                  key={event.id}
                  href={`/events/${event.slug}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="block w-full p-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm leading-tight pr-2">
                      {event.title}
                    </h3>
                    {event.featured && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full flex-shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-[#BBBBBB]">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-3 h-3" />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-3 h-3" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                    )}
                  </div>
                  
                  {event.eventType && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getEventTypeColor(event.eventType)} text-white`}>
                        {event.eventType}
                      </span>
                    </div>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Social Media Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3"
        >
          <h2 className="text-white font-semibold text-lg mb-4 text-center">
            Follow Us
          </h2>
          
          {socialLinks.map((social, index) => (
            <motion.a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center gap-3 w-full p-4 bg-gradient-to-r ${social.color} rounded-xl hover:shadow-lg transition-all duration-300 text-white font-medium`}
            >
              <social.icon className="w-5 h-5" />
              <span>{social.name}</span>
            </motion.a>
          ))}
        </motion.div>

        {/* Additional Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/projects"
              className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300 text-white text-sm font-medium"
            >
              Projects
            </a>
            <a
              href="/team"
              className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300 text-white text-sm font-medium"
            >
              Team
            </a>
            <a
              href="/recruitment"
              className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300 text-white text-sm font-medium"
            >
              Join Us
            </a>
            <a
              href="/internships"
              className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300 text-white text-sm font-medium"
            >
              Internships
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 text-xs text-[#5e6472]"
        >
          <p>© 2025 AI Business Group</p>
          <p className="mt-1">University of Michigan</p>
        </motion.div>
      </div>
    </div>
  );
}