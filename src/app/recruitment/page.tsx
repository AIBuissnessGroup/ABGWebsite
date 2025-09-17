'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to convert UTC dates to EST for display
const convertUtcToEst = (utcDate: Date): Date => {
  const estOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  return new Date(utcDate.getTime() - estOffset);
};

interface MemberLevels {
  heroTitle: string;
  generalTitle: string;
  generalBullets: string[];
  projectTitle: string;
  projectBullets: string[];
  footerLines: string[];
}

interface Timeline {
  heroTitle: string;
  openRoundTitle: string;
  openItems: string[];
  closedRoundTitle: string;
  closedItems: string[];
}

interface RecruitmentEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string;
  location?: string;
  venue?: string;
  capacity?: number;
  eventType: string;
  imageUrl?: string;
  featured?: boolean;
  published?: boolean;
  attendanceConfirmEnabled?: boolean;
  registrationEnabled?: boolean;
  registrationUrl?: string;
  registrationCtaLabel?: string;
}

interface AttendanceModal {
  show: boolean;
  eventId: string;
  eventTitle: string;
}

// Define theme colors for different urgency levels with animation properties
const getThemeColors = (theme: string) => {
  switch (theme) {
    case 'critical': // Last 5 minutes
      return {
        bgGradient: 'from-red-900 via-red-800 to-pink-900',
        sectionBg: 'bg-red-900/20',
        cardBg: 'bg-red-500/10 border-red-300/30',
        textAccent: 'text-red-300',
        buttonBg: 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
        glowColor: 'shadow-red-500/30',
        particleColor: 'red',
        waveColor: '#cf2020ff',
        pulseIntensity: 'animate-pulse',
        shakeIntensity: 'animate-bounce'
      };
    case 'urgent': // Last 15 minutes
      return {
        bgGradient: 'from-red-800 via-orange-800 to-amber-800',
        sectionBg: 'bg-orange-900/20',
        cardBg: 'bg-orange-500/10 border-orange-300/30',
        textAccent: 'text-orange-300',
        buttonBg: 'from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700',
        glowColor: 'shadow-orange-500/30',
        particleColor: 'orange',
        waveColor: '#ea580c',
        pulseIntensity: 'animate-pulse',
        shakeIntensity: ''
      };
    case 'soon': // Last 25 minutes
      return {
        bgGradient: 'from-amber-800 via-yellow-800 to-orange-800',
        sectionBg: 'bg-yellow-900/15',
        cardBg: 'bg-yellow-500/10 border-yellow-300/30',
        textAccent: 'text-yellow-300',
        buttonBg: 'from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700',
        glowColor: 'shadow-yellow-500/30',
        particleColor: 'yellow',
        waveColor: '#ffd415ff',
        pulseIntensity: '',
        shakeIntensity: ''
      };
    case 'complete': // Applications are live - Changed to blue background, project buttons stay green
      return {
        bgGradient: 'from-[#00274c] to-[#1a2c45]',
        sectionBg: 'bg-blue-900/10',
        cardBg: 'bg-white/10 border-white/20',
        textAccent: 'text-blue-300',
        buttonBg: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        glowColor: 'shadow-blue-500/30',
        particleColor: 'blue',
        waveColor: '#2563eb',
        pulseIntensity: '',
        shakeIntensity: ''
      };
    default: // Normal (more than 25 minutes)
      return {
        bgGradient: 'from-[#00274c] to-[#1a2c45]',
        sectionBg: 'bg-blue-900/10',
        cardBg: 'bg-white/10 border-white/20',
        textAccent: 'text-blue-300',
        buttonBg: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        glowColor: 'shadow-blue-500/30',
        particleColor: 'blue',
        waveColor: '#2563eb',
        pulseIntensity: '',
        shakeIntensity: ''
      };
  }
};

export default function RecruitmentPage() {
  const { data: session, status } = useSession();
  const [memberLevels, setMemberLevels] = useState<MemberLevels | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [recruitmentEvents, setRecruitmentEvents] = useState<RecruitmentEvent[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [attendanceModal, setAttendanceModal] = useState<AttendanceModal>({ show: false, eventId: '', eventTitle: '' });
  const [attendancePassword, setAttendancePassword] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
  // Powerdown sequence states
  const [isPoweredDown, setIsPoweredDown] = useState(false);
  const [showBlackScreen, setShowBlackScreen] = useState(false); // For glitch effect during powerdown
  const [showContinuousBlackScreen, setShowContinuousBlackScreen] = useState(false); // For continuous black background
  const [showLogo, setShowLogo] = useState(false);
  const [showRebooting, setShowRebooting] = useState(false);
  const [showApplicationsLive, setShowApplicationsLive] = useState(false);
  
  // Check if deadline has already passed and set initial state accordingly
  const [rebootComplete, setRebootComplete] = useState(() => {
    const deadline = new Date();
    deadline.setFullYear(2025, 8, 11); // Same deadline as applicationDeadline - 8 = September
    deadline.setHours(19, 40, 0, 0); // Must match applicationDeadline time - 7:40 PM EST
    // If deadline has passed, applications are already live (skip sequence)
    return deadline.getTime() <= Date.now();
  });
  
  const [frozenTheme, setFrozenTheme] = useState<string | null>(null);
  
  // Set application deadline - runs once, no automatic reset
  const [applicationDeadline, setApplicationDeadline] = useState(() => {
    const deadline = new Date();
    
    // For testing: Uncomment the line below to set deadline 2 minutes from now
    // deadline.setTime(deadline.getTime() + 2 * 60 * 1000); // 2 minutes from now
    // return deadline;
    
    // Production: Set to specific date and time (applications go live once and stay live)
    // Set to September 11, 2025 at 7:40 PM EST - once this passes, applications are permanently live
    deadline.setFullYear(2025, 8, 11); // Month is 0-indexed, so 8 = September
    deadline.setHours(19, 40, 0, 0);
    
    return deadline;
  });
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showApplicationsLiveText, setShowApplicationsLiveText] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [videoPlayAttempted, setVideoPlayAttempted] = useState(false);
  // Theme transition states
  const [previousTheme, setPreviousTheme] = useState<string>('normal');
  const [themeTransitionTrigger, setThemeTransitionTrigger] = useState(0);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  
  // Timer state

  // Helper functions (defined before useEffect hooks to avoid reference errors)
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  const formatApplicationCountdown = () => {
    const difference = applicationDeadline.getTime() - currentTime.getTime();
    
    if (difference <= 0) {
      // Countdown is over - powerdown sequence will handle the video
      return null; 
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Format with exciting styling
    if (days > 0) return `${days}D : ${hours}H : ${minutes}M : ${seconds}S`;
    if (hours > 0) return `${hours}H : ${minutes}M : ${seconds}S`;
    if (minutes > 0) return `${minutes}M : ${seconds}S`;
    return `${seconds}S LEFT!`;
  };

  // Get urgency level for styling - 10 minute total span
  const getCountdownUrgency = () => {
    const difference = applicationDeadline.getTime() - currentTime.getTime();
    const minutesLeft = difference / (1000 * 60);
    
    if (minutesLeft <= 1.5) return 'critical';   // Last 1.5 minutes - red
    if (minutesLeft <= 5) return 'urgent';      // 1.5-5 minutes - orange  
    if (minutesLeft <= 10) return 'soon';       // 5-10 minutes - yellow
    return 'normal'; // More than 10 minutes - purple
  };

  // Get page-wide color theme based on countdown urgency
  const getPageTheme = () => {
    // If theme is frozen during powerdown, use frozen theme
    if (frozenTheme) return frozenTheme;
    
    const countdown = formatApplicationCountdown();
    if (!countdown) return 'complete'; // Applications are live
    
    const urgency = getCountdownUrgency();
    return urgency;
  };

  useEffect(() => {
    loadRecruitmentData();
  }, [session]);

  // Update timer every second and handle powerdown sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Check if countdown has ended and trigger powerdown sequence (runs only once)
      // Skip sequence if rebootComplete is already true (deadline passed before component loaded)
      const difference = applicationDeadline.getTime() - new Date().getTime();
      if (difference <= 0 && !isPoweredDown && !showVideo && !rebootComplete) {
        // Freeze the current theme before powerdown
        setFrozenTheme(getPageTheme());
        setIsPoweredDown(true);
        
        // Start continuous black screen that will last until the end
        setShowContinuousBlackScreen(true);
        
        // Pixel-style powerdown sequence - slower and more dramatic
        setTimeout(() => {
          setShowBlackScreen(true);
        }, 1000); // 1 second delay for pixel powerdown effect
        
        // Complete shutdown and reboot sequence - add 3 second pause after glitch
        setTimeout(() => {
          // Hide glitch effects but keep continuous black screen
          setShowBlackScreen(false);
          
          // Add 3 second pause before rebooting starts
          setTimeout(() => {
            setShowRebooting(true);
            
            // Complete rebooting and add 2 second pause after reboot
            setTimeout(() => {
              setShowRebooting(false);
              
              // Add 2 second pause after rebooting before logo starts
              setTimeout(() => {
                setShowLogo(true);
                
                // After logo blinks, add 1 second pause before video
                setTimeout(() => {
                  // 1 second pause before video starts
                  setTimeout(() => {
                    setShowVideo(true);
                    
                    // After video ends, add 3 second pause before "Applications Are Live"
                    // This will be handled by video end event with modified timing
                  }, 1000); // 1 second pause before video
                }, 8000); // Logo blinking duration
              }, 2000); // 2 second pause after rebooting
            }, 15000); // 15 seconds of rebooting
          }, 3000); // 3 second pause before rebooting starts
        }, 7000); // Keep glitch effect active for 3 seconds + 3 second pause (1s delay + 3s glitch + 3s pause = 7s)
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [applicationDeadline, isPoweredDown, showVideo, rebootComplete]);

  // Handle logo fadeout when video starts
  useEffect(() => {
    if (showVideo && showLogo) {
      // Hide logo after fade animation completes
      setTimeout(() => {
        setShowLogo(false);
      }, 2500); // 2.5 seconds to complete the fade
    }
  }, [showVideo, showLogo]);

  // Theme transition detection
  useEffect(() => {
    const currentTheme = getPageTheme();
    if (currentTheme !== previousTheme) {
      setIsThemeTransitioning(true);
      setThemeTransitionTrigger(prev => prev + 1);
      
      // Keep transition state active permanently once we hit urgent/critical
      if (currentTheme === 'urgent' || currentTheme === 'critical' || currentTheme === 'soon') {
        // Don't reset transition state - keep glitching!
        setPreviousTheme(currentTheme);
      } else {
        // Reset only for normal/complete states
        setTimeout(() => {
          setIsThemeTransitioning(false);
          setPreviousTheme(currentTheme);
        }, 2000);
      }
    }
  }, [currentTime]);

  // Get glitch intensity based on time remaining - 10 minute span
  const getGlitchIntensity = () => {
    const difference = applicationDeadline.getTime() - currentTime.getTime();
    const minutesLeft = difference / (1000 * 60);
    const secondsLeft = difference / 1000;
    
    if (!formatApplicationCountdown()) return 0; // Applications are live
    
    if (minutesLeft <= 1.5) {
      // Critical: Maximum chaos, gets worse every second (last 1.5 minutes)
      return Math.min(1, 0.7 + (90 - secondsLeft) / 90 * 0.3); // 0.7 to 1.0
    }
    if (minutesLeft <= 5) {
      // Urgent: Heavy glitching, building up (1.5-5 minutes)
      return Math.min(0.7, 0.4 + (300 - secondsLeft) / 300 * 0.3); // 0.4 to 0.7
    }
    if (minutesLeft <= 10) {
      // Soon: Medium glitching starts (5-10 minutes)
      return Math.min(0.4, 0.2 + (600 - secondsLeft) / 600 * 0.2); // 0.2 to 0.4
    }
    return 0; // Normal: No glitching (more than 10 minutes)
  };

  const glitchIntensity = getGlitchIntensity();

  const getNextEvent = () => {
    const futureEvents = recruitmentEvents
      .filter(event => new Date(event.eventDate) > currentTime)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    return futureEvents[0] || null;
  };

  const getLiveEvent = () => {
    return recruitmentEvents.find(event => {
      const startTime = new Date(event.eventDate);
      const endTime = event.endDate ? new Date(event.endDate) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
      return startTime <= currentTime && currentTime <= endTime;
    }) || null;
  };

  const formatTimeUntil = (date: Date) => {
    const difference = date.getTime() - currentTime.getTime();
    
    if (difference <= 0) return 'Event started';
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Helper functions for description expansion
  const toggleDescription = (eventId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const isDescriptionLong = (description: string) => {
    // Consider description long if it's more than 150 characters or has more than 2 lines of text
    return description.length > 150;
  };

  const parseLinksInDescription = (description: string) => {
    // Parse [text](url) syntax and convert to clickable links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkRegex.exec(description)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(description.substring(lastIndex, match.index));
      }
      
      // Add the link
      const linkText = match[1];
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-200 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {linkText}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last link
    if (lastIndex < description.length) {
      parts.push(description.substring(lastIndex));
    }
    
    return parts.length > 1 ? parts : description;
  };

  const getTruncatedDescription = (description: string) => {
    if (description.length <= 150) return parseLinksInDescription(description);
    
    const truncated = description.substring(0, 150);
    // Make sure we don't cut a link in half
    const lastLinkStart = truncated.lastIndexOf('[');
    const lastLinkEnd = truncated.lastIndexOf(']');
    const lastParenStart = truncated.lastIndexOf('(');
    const lastParenEnd = truncated.lastIndexOf(')');
    
    // If we're in the middle of a link, truncate before it
    if (lastLinkStart > lastLinkEnd || lastParenStart > lastParenEnd) {
      const safeEnd = Math.max(0, Math.min(lastLinkStart, lastParenStart));
      if (safeEnd > 100) { // Only if we have enough content
        return parseLinksInDescription(description.substring(0, safeEnd) + '...');
      }
    }
    
    return parseLinksInDescription(truncated + '...');
  };

  const nextEvent = getNextEvent();
  const liveEvent = getLiveEvent();

  // Auto-center timeline on live/next event
  useEffect(() => {
    if (recruitmentEvents.length > 0 && (liveEvent || nextEvent)) {
      const timeoutId = setTimeout(() => {
        const container = document.querySelector('#timeline-container') as HTMLElement;
        if (container) {
          const targetEvent = liveEvent || nextEvent;
          const targetElement = container.querySelector(`[data-event-id="${targetEvent?.id}"]`) as HTMLElement;
          if (targetElement) {
            const elementLeft = targetElement.offsetLeft;
            const elementWidth = targetElement.offsetWidth;
            const containerWidth = container.offsetWidth;
            const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
            
            container.scrollTo({
              left: Math.max(0, scrollPosition),
              behavior: 'smooth'
            });
          }
        }
      }, 1500); // Give time for elements to render

      return () => clearTimeout(timeoutId);
    }
  }, [recruitmentEvents, liveEvent, nextEvent]);

  const loadRecruitmentData = async () => {
    try {
      const [levelsRes, timelineRes, eventsRes] = await Promise.all([
        fetch('/api/recruitment/member-levels'),
        fetch('/api/recruitment/timeline'),
        fetch('/api/events?eventType=RECRUITMENT'),
      ]);

      const levelsData = await levelsRes.json();
      const timelineData = await timelineRes.json();
      const eventsData = await eventsRes.json();

      setMemberLevels(levelsData);
      setTimeline(timelineData);
      
      // Convert database number values to booleans for the frontend
      const processedEvents = Array.isArray(eventsData) ? eventsData.map((event: any) => ({
        ...event,
        attendanceConfirmEnabled: Boolean(event.attendanceConfirmEnabled),
        registrationEnabled: Boolean(event.registrationEnabled),
        featured: Boolean(event.featured),
        published: Boolean(event.published)
      })) : [];
      
      console.log('Processed events:', processedEvents.map(e => ({ 
        title: e.title, 
        attendanceConfirmEnabled: e.attendanceConfirmEnabled, 
        registrationEnabled: e.registrationEnabled,
        registrationUrl: e.registrationUrl 
      })));
      
      setRecruitmentEvents(processedEvents);

      // Load attendance status if user is logged in
      if (session?.user?.email && processedEvents.length > 0) {
        const attendancePromises = processedEvents.map(async (event: RecruitmentEvent) => {
          if (event.attendanceConfirmEnabled) {
            try {
              const res = await fetch(`/api/events/${event.id}/attendance/confirm`);
              if (res.ok) {
                const data = await res.json();
                return { eventId: event.id, attended: data.attended };
              }
            } catch (error) {
              console.error('Error checking attendance for event:', event.id, error);
            }
          }
          return { eventId: event.id, attended: false };
        });

        const attendanceResults = await Promise.all(attendancePromises);
        const attendanceMap: Record<string, boolean> = {};
        attendanceResults.forEach(result => {
          attendanceMap[result.eventId] = result.attended;
        });
        setAttendanceStatus(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading recruitment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAttendance = async () => {
    if (!attendancePassword.trim()) {
      alert('Please enter the attendance password.');
      return;
    }

    setAttendanceLoading(true);
    try {
      const response = await fetch(`/api/events/${attendanceModal.eventId}/attendance/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: attendancePassword }),
      });

      if (response.ok) {
        setAttendanceStatus(prev => ({
          ...prev,
          [attendanceModal.eventId]: true
        }));
        setAttendanceModal({ show: false, eventId: '', eventTitle: '' });
        setAttendancePassword('');
        alert('Attendance confirmed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to confirm attendance.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
      console.error('Attendance confirmation error:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  const pageTheme = getPageTheme();

  // Master rendering logic - prevents flashing
  const shouldShowNormalContent = () => {
    return formatApplicationCountdown() && !isPoweredDown;
  };

  const shouldShowVideoOrPowerdown = () => {
    // Only show video if it's actually supposed to be playing (not during black screen, rebooting, or logo phases)
    return (showVideo && !videoEnded) || showApplicationsLive;
  };

  const shouldShowApplicationButton = () => {
    // Show buttons when countdown is over AND (either reboot is complete OR we never went through powerdown)
    return !formatApplicationCountdown() && !showVideo && (!isPoweredDown || rebootComplete);
  };

  const themeColors = getThemeColors(frozenTheme || pageTheme);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.bgGradient} transition-all duration-1000 relative overflow-hidden`}>
      
      {/* Powerdown Sequence Overlays */}
      <AnimatePresence>
        {/* Continuous Black Screen - stays on from powerdown until after Applications Are Live */}
        {showContinuousBlackScreen && (
          <motion.div
            key="continuousBlackScreen"
            className="fixed inset-0 bg-black z-[9997]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        
        {/* Pixel Glitch Powerdown Effect - only show during glitch phase */}
        {showBlackScreen && !showVideo && (
          <motion.div
            key="blackScreen"
            className="fixed inset-0 z-[9999]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0 }}
          >
            {/* Solid black background that immediately takes over */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
            />
            
            {/* Simple pixel static effect without colors - fades out quickly */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 2px,
                  rgba(255,255,255,0.05) 2px,
                  rgba(255,255,255,0.05) 4px
                )`
              }}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: [0.3, 0.1, 0.2, 0.05, 0.1, 0.02, 0, 0],
                scale: [1, 1.01, 0.99, 1, 0.99, 1, 1, 1]
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeOut",
                repeat: 1
              }}
            />
          </motion.div>
        )}
        
        {/* Black screen for video background */}
        {showVideo && (
          <motion.div
            key="videoBlackScreen"
            className="fixed inset-0 bg-black z-[9998]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0 }}
          />
        )}
        
        {/* Blinking ABG Logo with slow fade */}
        {showLogo && (
          <motion.div
            key="logo"
            className={`fixed inset-0 ${showVideo ? 'bg-transparent z-[9998]' : 'bg-black z-[9999]'} flex items-center justify-center`}
            initial={{ opacity: 1 }}
            animate={{ opacity: showVideo ? 0 : 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: showVideo ? 2.0 : 0 }}
          >
            <motion.div
              className="relative"
              animate={{
                opacity: showVideo ? 0 : [1, 0.05, 1, 0.02, 1, 0.15, 1, 0.03, 1],
                scale: showVideo ? 0.8 : [1, 1.02, 1, 1.04, 1, 1.01, 1, 1.06, 1]
              }}
              transition={{
                duration: showVideo ? 2.0 : 6.5,
                repeat: showVideo ? 0 : Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Use the provided circular logo */}
              <div className="w-40 h-40 relative">
                <img 
                  src="/circleLogo.png" 
                  alt="ABG Logo" 
                  className="w-full h-full"
                />
                {/* Add some glow effect */}
                <div className="absolute inset-0 w-full h-full bg-blue-500/20 rounded-full blur-xl"></div>
              </div>
              
              {/* Pulsing ring effect */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                animate={{
                  scale: showVideo ? 1 : [1, 1.4, 1],
                  opacity: showVideo ? 0 : [0.3, 0, 0.3]
                }}
                transition={{
                  duration: showVideo ? 2.0 : 5.0,
                  repeat: showVideo ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>
        )}
        
        {/* Rebooting Screen */}
        {showRebooting && (
          <motion.div
            key="rebooting"
            className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0 }}
          >
            <div className="text-center">
              {/* Rebooting text with stalling effects */}
              <motion.div
                className="text-green-400 font-mono text-2xl mb-8"
                animate={{
                  opacity: [0.5, 1, 0.5, 0.2, 0.8, 0.3, 1, 0.6]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                REBOOTING...
              </motion.div>
              
              {/* Loading bar with realistic stalls */}
              <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: ["0%", "5%", "5%", "12%", "12%", "20%", "22%", "22%", "28%", "32%", "32%", "40%", "45%", "45%", "55%", "60%", "60%", "70%", "75%", "80%", "85%", "85%", "95%", "100%"]
                  }}
                  transition={{ 
                    duration: 15, 
                    ease: "easeInOut",
                    times: [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.35, 0.42, 0.48, 0.54, 0.6, 0.66, 0.72, 0.78, 0.84, 0.88, 0.92, 0.94, 0.96, 0.97, 0.98, 0.985, 0.99, 1]
                  }}
                />
              </div>
              
              {/* Status messages that change during boot */}
              <motion.div
                className="text-green-300 font-mono text-sm mt-4 h-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.span
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 3, times: [0, 0.1, 0.8, 1] }}
                >
                  Initializing system...
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 3, delay: 2.5, times: [0, 0.1, 0.2, 0.8, 1] }}
                >
                  Loading modules...
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 3, delay: 5, times: [0, 0.1, 0.2, 0.8, 1] }}
                >
                  Starting services...
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 0, 1, 1] }}
                  transition={{ duration: 2, delay: 8, times: [0, 0.2, 0.3, 1] }}
                >
                  Ready.
                </motion.span>
              </motion.div>
              
              {/* Scanning lines effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent"
                animate={{
                  y: ["-100%", "100%"]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </motion.div>
        )}
        

        
        {/* Applications Are Live Text (appears after video on black screen) */}
        {showApplicationsLiveText && (
          <motion.div
            key="applicationsLiveText"
            className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut"
              }}
            >
              <motion.h1
                className="text-6xl md:text-8xl font-bold text-white mb-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  scale: [1, 1.05, 1, 1.02, 1] // Pulsate after all words appear
                }}
                transition={{ 
                  y: { delay: 1, duration: 1.2, ease: "easeOut" },
                  opacity: { delay: 1, duration: 1.2, ease: "easeOut" },
                  scale: { delay: 6, duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
                }}
              >
                APPLICATIONS
              </motion.h1>
              <motion.h1
                className="text-6xl md:text-8xl font-bold text-green-400 mb-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  scale: [1, 1.08, 1, 1.04, 1] // Pulsate after all words appear
                }}
                transition={{ 
                  y: { delay: 2.5, duration: 1.2, ease: "easeOut" },
                  opacity: { delay: 2.5, duration: 1.2, ease: "easeOut" },
                  scale: { delay: 6.2, duration: 1.8, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
                }}
              >
                NOW
              </motion.h1>
              <motion.h1
                className="text-6xl md:text-8xl font-bold text-white"
                initial={{ y: 50, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  scale: [1, 1.06, 1, 1.03, 1] // Pulsate after all words appear
                }}
                transition={{ 
                  y: { delay: 4, duration: 1.2, ease: "easeOut" },
                  opacity: { delay: 4, duration: 1.2, ease: "easeOut" },
                  scale: { delay: 6.4, duration: 2.2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
                }}
              >
                LIVE
              </motion.h1>
            </motion.div>
          </motion.div>
        )}
        
        {/* Video Overlay - plays over black screen */}
        {showVideo && (
          <motion.div 
            key="video"
            className="fixed inset-0 z-[10001] flex items-center justify-center p-8"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50, rotateX: -15 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.22, 1, 0.36, 1],
              scale: { type: "spring", damping: 20, stiffness: 100 }
            }}
          >
            <motion.div 
              className="relative max-w-4xl mx-auto"
              initial={{ rotateX: 15, z: -100 }}
              animate={{ rotateX: 0, z: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              style={{ 
                perspective: 1000,
                transformStyle: "preserve-3d"
              }}
            >
              <motion.video
                initial={{ opacity: 0, scale: 0.95, boxShadow: "0 0 0 rgba(255,255,255,0)" }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,255,0.1)"
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.4,
                  ease: "easeOut",
                  boxShadow: { duration: 1, delay: 0.6 }
                }}
                ref={(video) => {
                  if (video && !videoPlayAttempted) {
                    setVideoPlayAttempted(true);
                    
                    // Aggressive autoplay - try unmuted first, fallback to muted
                    const attemptPlay = async () => {
                      try {
                        // First attempt: Try unmuted autoplay (will work if user has interacted with site)
                        video.muted = false;
                        video.volume = 0.8;
                        await video.play();
                        console.log('Video playing with audio (unmuted autoplay succeeded)');
                        setAudioBlocked(false);
                      } catch (error) {
                        console.log('Unmuted autoplay blocked, falling back to muted:', error);
                        try {
                          // Fallback: Muted autoplay (always works)
                          video.muted = true;
                          video.volume = 0.8;
                          await video.play();
                          console.log('Video playing muted (fallback)');
                          
                          // Try to unmute after a short delay (sometimes works)
                          setTimeout(() => {
                            try {
                              video.muted = false;
                              console.log('Successfully unmuted after delay');
                            } catch (e) {
                              console.log('Could not unmute after delay');
                            }
                          }, 500);
                          
                          setAudioBlocked(false);
                        } catch (mutedError) {
                          console.log('Even muted autoplay failed:', mutedError);
                          setAudioBlocked(true);
                        }
                      }
                    };

                    // Give video time to load
                    setTimeout(attemptPlay, 100);
                  }
                }}
                onEnded={() => {
                  setVideoEnded(true);
                  setShowVideo(false);
                  setAudioBlocked(false);
                  setVideoPlayAttempted(false);
                  
                  // Add 3 second pause after video before showing "Applications Are Live" text
                  setTimeout(() => {
                    setShowApplicationsLiveText(true);
                    
                    // Hide text after longer duration and complete reboot to normal page
                    setTimeout(() => {
                      setShowApplicationsLiveText(false);
                      setShowContinuousBlackScreen(false); // Turn off continuous black screen
                      setFrozenTheme(null); // Clear frozen theme to return to normal
                      setRebootComplete(true);
                    }, 6000); // Show text for 6 seconds
                  }, 3000); // 3 second pause after video ends
                }}
                controls
                autoPlay
                muted
                className="w-full h-auto rounded-xl shadow-2xl border border-white/20"
                playsInline
                preload="auto"
              >
                <source src="/videos/application-launch.mp4" type="video/mp4" />
                <source src="/videos/application-launch.webm" type="video/webm" />
                {/* Fallback for browsers that don't support video */}
                Your browser does not support the video tag.
              </motion.video>
              
              {/* Skip button */}
              <motion.button
                onClick={() => {
                  setVideoEnded(true);
                  setShowVideo(false);
                  setAudioBlocked(false);
                  setVideoPlayAttempted(false);
                  
                  // Add 3 second pause after video before showing "Applications Are Live" text
                  setTimeout(() => {
                    setShowApplicationsLiveText(true);
                    
                    // Hide text after longer duration and complete reboot to normal page
                    setTimeout(() => {
                      setShowApplicationsLiveText(false);
                      setShowContinuousBlackScreen(false); // Turn off continuous black screen
                      setFrozenTheme(null); // Reset frozen theme to return to normal blue theme
                      setRebootComplete(true);
                    }, 6000); // Show text for 6 seconds
                  }, 3000); // 3 second pause after video ends
                }}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/20"
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.8)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                Skip Video
              </motion.button>

              {/* Subtle play/pause button */}
              <motion.button
                onClick={(e) => {
                  const video = e.currentTarget.parentElement?.querySelector('video');
                  if (video) {
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }
                }}
                className="absolute bottom-4 left-4 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white px-2 py-1 rounded text-xs font-medium transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.6)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                ▶️
              </motion.button>

              {/* Subtle unmute button */}
              <motion.button
                onClick={(e) => {
                  const video = e.currentTarget.parentElement?.querySelector('video');
                  if (video) {
                    video.muted = !video.muted;
                  }
                }}
                className="absolute bottom-4 left-12 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white px-2 py-1 rounded text-xs font-medium transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.6)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3, delay: 0.9 }}
              >
                🔊
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Animated Background Effects */}
      <AnimatePresence mode="wait">
        <motion.div
          key={themeTransitionTrigger}
          className="fixed inset-0 pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Continuous Glitch Effects - Intensity Based on Time Remaining */}
          {glitchIntensity > 0 && (
            <>
              {/* Multiple Explosive Wave Rings - Always Present When Glitching */}
              {[1, 2, 3, 4, 5].map((ring) => (
                <motion.div
                  key={`explosive-ring-${ring}`}
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at ${50 + (ring * 10)}% ${50 + (ring * 7)}%, ${themeColors.waveColor}${Math.floor(glitchIntensity * 60)} 0%, transparent ${30 + ring * 15}%)`,
                    opacity: glitchIntensity * 0.8
                  }}
                  animate={{ 
                    scale: [0.8, 1.5 + glitchIntensity, 0.8], 
                    opacity: [glitchIntensity * 0.3, glitchIntensity * 0.9, glitchIntensity * 0.3], 
                    rotate: [0, 180 * ring * glitchIntensity, 360 * ring * glitchIntensity]
                  }}
                  transition={{ 
                    duration: Math.max(0.5, 3 - glitchIntensity * 2), 
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: ring * 0.1
                  }}
                />
              ))}

              {/* Glitch Screen Tear Effect - Continuous */}
              {Array.from({ length: Math.floor(7 * glitchIntensity) }).map((_, tear) => (
                <motion.div
                  key={`glitch-tear-${tear}-${Math.floor(currentTime.getTime() / 1000)}`}
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(${tear * 45}deg, transparent ${tear * 10}%, ${themeColors.waveColor}${Math.floor(glitchIntensity * 80)} ${tear * 10 + 2}%, transparent ${tear * 10 + 4}%)`,
                    opacity: glitchIntensity
                  }}
                  animate={{ 
                    x: [0, (Math.random() * 400 - 200) * glitchIntensity, 0],
                    opacity: [0, glitchIntensity, glitchIntensity * 0.5, 0],
                    skewX: [0, (Math.random() * 40 - 20) * glitchIntensity, 0],
                    scaleY: [1, 1 + glitchIntensity * 0.5, 1]
                  }}
                  transition={{ 
                    duration: Math.max(0.3, 1.8 - glitchIntensity),
                    ease: [0.25, 0.46, 0.45, 0.94],
                    repeat: Infinity,
                    delay: Math.random() * (2 - glitchIntensity)
                  }}
                />
              ))}

              {/* Digital Noise Effect - Persistent and Intensifying */}
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 20%, ${themeColors.waveColor}${Math.floor(glitchIntensity * 40)} 1px, transparent 1px),
                    radial-gradient(circle at 80% 80%, ${themeColors.waveColor}${Math.floor(glitchIntensity * 30)} 1px, transparent 1px),
                    radial-gradient(circle at 40% 60%, ${themeColors.waveColor}${Math.floor(glitchIntensity * 50)} 1px, transparent 1px)
                  `,
                  backgroundSize: `${8 + glitchIntensity * 4}px ${8 + glitchIntensity * 4}px, ${12 + glitchIntensity * 6}px ${12 + glitchIntensity * 6}px, ${6 + glitchIntensity * 3}px ${6 + glitchIntensity * 3}px`,
                  opacity: glitchIntensity * 0.6
                }}
                animate={{
                  backgroundPosition: [
                    '0px 0px, 0px 0px, 0px 0px',
                    `${20 * glitchIntensity}px ${20 * glitchIntensity}px, -${15 * glitchIntensity}px ${15 * glitchIntensity}px, ${8 * glitchIntensity}px -${8 * glitchIntensity}px`,
                    `${40 * glitchIntensity}px -${20 * glitchIntensity}px, ${30 * glitchIntensity}px -${30 * glitchIntensity}px, -${16 * glitchIntensity}px ${16 * glitchIntensity}px`,
                    '0px 0px, 0px 0px, 0px 0px'
                  ]
                }}
                transition={{ 
                  duration: Math.max(0.5, 2 - glitchIntensity), 
                  ease: "easeInOut",
                  repeat: Infinity
                }}
              />

              {/* Screen Crack Effect - Persistent */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: glitchIntensity * 0.6 }}
              >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {Array.from({ length: Math.floor(4 + glitchIntensity * 6) }).map((_, crack) => {
                    const paths = [
                      "M10,20 L30,40 L50,35 L70,60 L90,50",
                      "M20,10 L40,30 L60,25 L80,50 L95,45",
                      "M5,60 L25,80 L45,75 L65,90 L85,85",
                      "M15,70 L35,90 L55,85 L75,95 L90,90",
                      "M25,15 L45,35 L65,30 L85,55 L95,50",
                      "M5,30 L25,50 L45,45 L65,70 L85,65",
                      "M15,80 L35,95 L55,90 L75,100 L95,95",
                      "M30,5 L50,25 L70,20 L90,45 L100,40",
                      "M0,40 L20,60 L40,55 L60,80 L80,75",
                      "M10,90 L30,100 L50,95 L70,100 L90,100"
                    ];
                    return (
                      <motion.path
                        key={`crack-${crack}`}
                        d={paths[crack % paths.length]}
                        stroke={themeColors.waveColor}
                        strokeWidth={0.5 + glitchIntensity}
                        fill="none"
                        opacity={glitchIntensity}
                        animate={{ 
                          pathLength: [0, 1, 0.8, 1],
                          opacity: [glitchIntensity * 0.3, glitchIntensity, glitchIntensity * 0.7, glitchIntensity]
                        }}
                        transition={{ 
                          duration: Math.max(0.8, 2 - glitchIntensity),
                          repeat: Infinity,
                          delay: crack * 0.1
                        }}
                      />
                    );
                  })}
                </svg>
              </motion.div>
            </>
          )}

          {/* Enhanced Floating Particles - Continuous, Intensity-Based Chaos */}
          {Array.from({ length: Math.floor(5 + glitchIntensity * 45) }).map((_, i) => (
            <motion.div
              key={`${themeTransitionTrigger}-${i}`}
              className={`absolute rounded-full ${glitchIntensity > 0.5 ? 'animate-ping' : ''}`}
              style={{
                background: themeColors.waveColor,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${1 + glitchIntensity * 6}px`,
                height: `${1 + glitchIntensity * 6}px`,
                opacity: 0.3 + glitchIntensity * 0.7,
                boxShadow: glitchIntensity > 0.5 ? `0 0 ${glitchIntensity * 10}px ${themeColors.waveColor}` : 'none'
              }}
              animate={{
                y: [0, -(100 + glitchIntensity * 300), 0],
                x: [0, (Math.random() * 200 - 100) * glitchIntensity, 0],
                opacity: [0, 0.3 + glitchIntensity * 0.7, 0.5 + glitchIntensity * 0.5, 0],
                scale: [0, 1 + glitchIntensity * 2, 0.5 + glitchIntensity, 0],
                rotate: glitchIntensity > 0.3 ? [0, 360 * glitchIntensity] : [0]
              }}
              transition={{
                duration: Math.max(1, 4 - glitchIntensity * 2) + Math.random(),
                repeat: Infinity,
                delay: Math.random() * (2 - glitchIntensity),
                ease: glitchIntensity > 0.5 ? [0.25, 0.46, 0.45, 0.94] : "easeInOut"
              }}
            />
          ))}

          {/* Continuous Pulse Waves - Intensity Increases Over Time */}
          {glitchIntensity > 0.2 && (
            <>
              {Array.from({ length: Math.floor(3 + glitchIntensity * 6) }, (_, ring) => (
                <motion.div
                  key={`pulse-${ring}-${themeTransitionTrigger}`}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: `${(ring + 1) * (100 + glitchIntensity * 100)}px`,
                    height: `${(ring + 1) * (100 + glitchIntensity * 100)}px`,
                    border: `${Math.floor(1 + glitchIntensity * 3)}px solid ${themeColors.waveColor}${Math.floor(20 + glitchIntensity * 40)}`,
                    borderRadius: '50%',
                    boxShadow: glitchIntensity > 0.5 ? `0 0 ${ring * 20 * glitchIntensity}px ${themeColors.waveColor}40` : 'none'
                  }}
                  animate={{
                    scale: [0.5, 2 + glitchIntensity * 2, 1, 0.5],
                    opacity: [glitchIntensity * 0.8, glitchIntensity * 0.2, glitchIntensity * 0.6, 0],
                    rotate: glitchIntensity > 0.5 ? [0, 180 * glitchIntensity, 360 * glitchIntensity] : [0],
                    borderWidth: [`${1 + glitchIntensity}px`, `${3 + glitchIntensity * 2}px`, `${1 + glitchIntensity}px`]
                  }}
                  transition={{
                    duration: Math.max(0.8, 2 - glitchIntensity),
                    repeat: Infinity,
                    delay: ring * 0.1,
                    ease: glitchIntensity > 0.7 ? [0.25, 0.46, 0.45, 0.94] : "easeInOut"
                  }}
                />
              ))}
              
              {/* Electric Arc Effects - Continuous for High Intensity */}
              {glitchIntensity > 0.6 && Array.from({ length: Math.floor(glitchIntensity * 5) }, (_, arc) => (
                <motion.div
                  key={`electric-arc-${arc}`}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: `${(arc + 1) * 150 * glitchIntensity}px`,
                    height: `${(arc + 1) * 150 * glitchIntensity}px`,
                    border: `${1 + glitchIntensity}px dashed ${themeColors.waveColor}${Math.floor(50 + glitchIntensity * 30)}`,
                    borderRadius: '50%'
                  }}
                  animate={{
                    scale: [0, 2 * glitchIntensity, 0],
                    opacity: [0, glitchIntensity * 0.8, 0],
                    rotate: [0, -360 * glitchIntensity]
                  }}
                  transition={{
                    duration: Math.max(0.5, 1.2 - glitchIntensity * 0.5),
                    repeat: Infinity,
                    delay: arc * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}

              {/* Screen Vibration Lines */}
              {glitchIntensity > 0.4 && Array.from({ length: Math.floor(glitchIntensity * 10) }, (_, line) => (
                <motion.div
                  key={`vibration-line-${line}`}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${line * (100 / (glitchIntensity * 10))}%`,
                    height: `${1 + glitchIntensity * 2}px`,
                    background: `linear-gradient(90deg, transparent, ${themeColors.waveColor}${Math.floor(glitchIntensity * 60)}, transparent)`,
                    mixBlendMode: 'screen'
                  }}
                  animate={{ 
                    x: [0, glitchIntensity * 10, -glitchIntensity * 10, 0],
                    opacity: [0, glitchIntensity, 0]
                  }}
                  transition={{ 
                    duration: Math.max(0.1, 0.5 - glitchIntensity * 0.3),
                    repeat: Infinity,
                    delay: Math.random() * 0.5
                  }}
                />
              ))}
            </>
          )}

          {/* Continuous Shimmer and Glitch Effects */}
          {glitchIntensity > 0.1 && (
            <>
              {/* Multiple overlapping shimmer waves - Continuous */}
              {Array.from({ length: Math.floor(1 + glitchIntensity * 4) }, (_, wave) => (
                <motion.div
                  key={`shimmer-${wave}`}
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(${45 + wave * 30}deg, transparent 20%, ${themeColors.waveColor}${Math.floor(10 + glitchIntensity * 30)} 50%, transparent 80%)`,
                    opacity: glitchIntensity * 0.8
                  }}
                  animate={{ 
                    x: ['-100%', '200%'], 
                    skewX: [-20 * glitchIntensity, 20 * glitchIntensity, -20 * glitchIntensity],
                    opacity: [0, glitchIntensity * 0.8, glitchIntensity * 0.4, 0]
                  }}
                  transition={{ 
                    duration: Math.max(1, 2.5 - glitchIntensity), 
                    ease: "easeInOut",
                    delay: wave * 0.2,
                    repeat: Infinity
                  }}
                />
              ))}

              {/* Continuous glitch bars */}
              {Array.from({ length: Math.floor(3 + glitchIntensity * 8) }, (_, bar) => (
                <motion.div
                  key={`glitch-bar-${bar}`}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${bar * (100 / (3 + glitchIntensity * 8))}%`,
                    height: `${1 + Math.random() * (1 + glitchIntensity * 8)}px`,
                    background: `linear-gradient(90deg, transparent, ${themeColors.waveColor}${Math.floor(30 + glitchIntensity * 40)}, transparent)`,
                    mixBlendMode: 'screen'
                  }}
                  animate={{ 
                    x: ['-100%', '100%', '-100%'],
                    opacity: [0, glitchIntensity, glitchIntensity * 0.5, 0],
                    scaleY: [1, 1 + glitchIntensity, 1]
                  }}
                  transition={{ 
                    duration: Math.max(0.3, 1 - glitchIntensity * 0.5),
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: Math.random() * (1 - glitchIntensity * 0.5),
                    repeat: Infinity
                  }}
                />
              ))}

              {/* Static TV Effect for High Intensity */}
              {glitchIntensity > 0.7 && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        ${themeColors.waveColor}${Math.floor(glitchIntensity * 15)} 2px,
                        ${themeColors.waveColor}${Math.floor(glitchIntensity * 15)} 4px
                      )
                    `,
                    opacity: glitchIntensity * 0.3
                  }}
                  animate={{
                    backgroundPosition: ['0px', `${glitchIntensity * 20}px`, '0px']
                  }}
                  transition={{
                    duration: Math.max(0.1, 0.3 - glitchIntensity * 0.2),
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              )}
            </>
          )}

          {/* Breathing Border Effect with Continuous Glitch */}
          <motion.div
            className="absolute inset-4 border rounded-3xl pointer-events-none"
            style={{
              borderColor: `${themeColors.waveColor}${Math.floor(20 + glitchIntensity * 50)}`,
              borderWidth: `${1 + glitchIntensity * 2}px`,
              filter: glitchIntensity > 0.5 ? `brightness(${1 + glitchIntensity * 0.5}) contrast(${1 + glitchIntensity * 0.3})` : 'none',
              boxShadow: glitchIntensity > 0.3 ? `0 0 ${glitchIntensity * 20}px ${themeColors.waveColor}${Math.floor(glitchIntensity * 30)}` : 'none'
            }}
            animate={{
              opacity: [
                0.1 + glitchIntensity * 0.3, 
                0.3 + glitchIntensity * 0.7, 
                0.1 + glitchIntensity * 0.3
              ],
              scale: [
                1, 
                1 + glitchIntensity * 0.01, 
                1
              ],
              borderWidth: [
                `${1 + glitchIntensity * 2}px`, 
                `${2 + glitchIntensity * 4}px`, 
                `${1 + glitchIntensity * 2}px`
              ],
              rotate: glitchIntensity > 0.5 ? [0, glitchIntensity * 2, -glitchIntensity * 2, 0] : [0],
              x: glitchIntensity > 0.7 ? [0, glitchIntensity * 2, -glitchIntensity * 2, 0] : [0],
              y: glitchIntensity > 0.7 ? [0, glitchIntensity, -glitchIntensity, 0] : [0]
            }}
            transition={{
              duration: Math.max(0.5, 3 - glitchIntensity * 2),
              repeat: Infinity,
              ease: glitchIntensity > 0.5 ? [0.25, 0.46, 0.45, 0.94] : "easeInOut"
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Theme Transition Flash Effect */}
      <AnimatePresence>
        {isThemeTransitioning && (
          <motion.div
            key="themeTransition"
            className="fixed inset-0 pointer-events-none z-50"
            style={{
              background: `radial-gradient(circle at center, ${themeColors.waveColor}15 0%, transparent 60%)`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Content Container with Continuous Screen Shake Based on Glitch Intensity */}
      <motion.div 
        className={`relative z-10 ${glitchIntensity > 0.3 ? 'glitch-transition' : ''} ${glitchIntensity > 0.6 ? 'digital-distort' : ''}`}
        animate={{
          x: glitchIntensity > 0.1 ? [
            0, 
            -glitchIntensity * 3, 
            glitchIntensity * 3, 
            -glitchIntensity * 2, 
            glitchIntensity * 2, 
            0
          ] : [0],
          y: glitchIntensity > 0.1 ? [
            0, 
            glitchIntensity * 2, 
            -glitchIntensity * 2, 
            glitchIntensity * 3, 
            -glitchIntensity, 
            0
          ] : [0],
          rotate: glitchIntensity > 0.2 ? [
            0, 
            glitchIntensity * 0.5, 
            -glitchIntensity * 0.5, 
            glitchIntensity * 0.3, 
            -glitchIntensity * 0.3, 
            0
          ] : [0],
          scale: glitchIntensity > 0.3 ? [
            1, 
            1 + glitchIntensity * 0.005, 
            1 - glitchIntensity * 0.005, 
            1 + glitchIntensity * 0.003, 
            1 - glitchIntensity * 0.003, 
            1
          ] : [1],
          filter: glitchIntensity > 0.4 ? [
            'brightness(1)', 
            `brightness(${1 + glitchIntensity * 0.2})`, 
            `brightness(${1 - glitchIntensity * 0.1})`, 
            `brightness(${1 + glitchIntensity * 0.1})`,
            'brightness(1)'
          ] : ['brightness(1)']
        }}
        transition={{
          duration: glitchIntensity > 0 ? Math.max(0.1, 0.6 - glitchIntensity * 0.3) : 0,
          ease: glitchIntensity > 0.5 ? [0.25, 0.46, 0.45, 0.94] : "easeOut",
          repeat: glitchIntensity > 0 ? Infinity : 0
        }}
      >

      {/* Hero Section */}
      <section className={`relative py-20 px-4 text-center ${themeColors.sectionBg} transition-all duration-1000`}>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Join ABG
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Whether you're a beginner or experienced, 
            we have opportunities that match your interests and goals.
          </p>
        </motion.div>
      </section>

      
      {/* Project Applications Section */}
      <section 
        className={`py-16 px-4 relative overflow-hidden transition-all duration-1000 ${
          formatApplicationCountdown() ? (
            getCountdownUrgency() === 'critical' ? 'bg-gradient-to-br from-red-900/20 via-pink-900/20 to-red-900/20' :
            getCountdownUrgency() === 'urgent' ? 'bg-gradient-to-br from-red-800/15 via-orange-800/15 to-yellow-800/15' :
            getCountdownUrgency() === 'soon' ? 'bg-gradient-to-br from-orange-800/15 via-yellow-800/15 to-orange-800/15' :
            'bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-blue-900/10'
          ) : 'bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-blue-900/10'
        }`}
      >
        {/* Simplified background indicator */}
        {formatApplicationCountdown() && (
          <div className={`absolute inset-0 border-2 rounded-lg pointer-events-none opacity-50 ${
            getCountdownUrgency() === 'critical' ? 'border-red-500/30' :
            getCountdownUrgency() === 'urgent' ? 'border-orange-500/30' :
            getCountdownUrgency() === 'soon' ? 'border-yellow-500/30' :
            'border-blue-500/30'
          }`} />
        )}

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {shouldShowNormalContent() ? (
                // Countdown content within section - immune to glitching but scrolls naturally
                <div className="text-center py-16">
                  <div 
                    className="countdown-isolated-overlay max-w-4xl mx-auto px-4"
                    style={{ 
                      transform: 'none !important',
                      willChange: 'auto !important',
                      animation: 'none !important',
                      filter: 'none !important',
                      opacity: '1 !important'
                    }}
                  >
                    {/* Simple glow effect */}
                    <div className={`absolute inset-0 rounded-2xl blur-lg ${
                      getCountdownUrgency() === 'critical' ? 'bg-gradient-to-r from-red-600/40 via-pink-600/40 to-red-600/40' :
                      getCountdownUrgency() === 'urgent' ? 'bg-gradient-to-r from-red-500/30 via-orange-500/30 to-yellow-500/30' :
                      getCountdownUrgency() === 'soon' ? 'bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-orange-500/30' :
                      'bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30'
                    }`}></div>
                    
                    {/* Main countdown container */}
                    <div className={`relative backdrop-blur-sm border-2 rounded-xl p-8 text-white shadow-2xl ${
                      getCountdownUrgency() === 'critical' ? 'bg-gradient-to-r from-red-600/30 via-pink-600/30 to-red-600/30 border-red-300/50' :
                      getCountdownUrgency() === 'urgent' ? 'bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 border-orange-300/40' :
                      getCountdownUrgency() === 'soon' ? 'bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-orange-500/20 border-yellow-300/40' :
                      'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 border-purple-300/40'
                    }`}>
                      {/* Urgent indicator */}
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${
                          getCountdownUrgency() === 'critical' ? 'bg-red-400' :
                          getCountdownUrgency() === 'urgent' ? 'bg-orange-400' :
                          getCountdownUrgency() === 'soon' ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`}></div>
                        <span className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${
                          getCountdownUrgency() === 'critical' ? 'text-red-300' :
                          getCountdownUrgency() === 'urgent' ? 'text-orange-300' :
                          getCountdownUrgency() === 'soon' ? 'text-yellow-300' :
                          'text-blue-300'
                        }`}>
                          {getCountdownUrgency() === 'critical' && (
                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {getCountdownUrgency() === 'critical' ? '⚠️ ONE MINUTE LEFT! ⚠️' :
                           getCountdownUrgency() === 'urgent' ? 'LAST COUPLE OF MINUTES' :
                           getCountdownUrgency() === 'soon' ? 'APPLICATIONS COMING SOON' :
                           'Applications Opening Soon!'}
                          {getCountdownUrgency() === 'critical' && (
                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          getCountdownUrgency() === 'critical' ? 'bg-red-400' :
                          getCountdownUrgency() === 'urgent' ? 'bg-orange-400' :
                          getCountdownUrgency() === 'soon' ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`}></div>
                      </div>
                      
                      {/* Countdown display */}
                      <div className="text-center">
                        <div className={`text-4xl sm:text-5xl md:text-6xl font-mono font-black mb-4 ${
                          getCountdownUrgency() === 'critical' ? 'text-red-100' :
                          getCountdownUrgency() === 'urgent' ? 'text-orange-100' :
                          getCountdownUrgency() === 'soon' ? 'text-yellow-200' :
                          'text-purple-200'
                        }`}>
                          {formatApplicationCountdown()}
                        </div>
                        
                        <div className={`text-lg font-bold ${
                          getCountdownUrgency() === 'critical' ? 'text-red-300' :
                          getCountdownUrgency() === 'urgent' ? 'text-orange-300' :
                          getCountdownUrgency() === 'soon' ? 'text-yellow-300' :
                          'text-purple-300'
                        }`}>
                          Until Project Applications Drop!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {shouldShowVideoOrPowerdown() ? (
                    // Video is now playing in overlay - show placeholder
                    <div key="video-placeholder" className="text-center py-8">
                      <div className="text-white/50 text-sm">Video playing in overlay</div>
                    </div>
                  ) : shouldShowApplicationButton() ? (
                  // Show application links when video is over and powerdown sequence is complete
                  <motion.div 
                    key="apply"
                    className="space-y-6"
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.2
                    }}
                  >
                    {/* Applications are now live message */}
                    <motion.div 
                      className="text-center mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <h3 className="text-3xl font-bold text-blue-400 mb-2">
                        Applications Are Now Live!
                      </h3>
                      <p className="text-white/80 text-lg mb-2">
                        Ready to join ABG? Choose your application path below:
                      </p>
                      <p className="text-white/60 text-sm">
                      </p>
                    </motion.div>

                    {/* Application buttons with hierarchy */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                      {/* PRIMARY: Project Applications - More prominent, larger */}
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        {/* Premium badge */}
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                     
                        </div>
                        
                        <motion.a
                          href="https://abgumich.org/forms/abg-fall-2025-project-team-application-form"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block backdrop-blur-sm border-3 border-green-300/70 hover:border-green-300/90 bg-gradient-to-r from-green-500/30 to-emerald-500/30 hover:from-green-500/40 hover:to-emerald-500/40 rounded-xl p-8 text-white font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-2xl"
                          whileHover={{ 
                            scale: 1.02,
                            boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)",
                            borderColor: "rgba(34, 197, 94, 0.9)"
                          }}
                        >
                          <div className="text-center mb-4">
                            <h4 className="text-2xl font-bold text-green-200 mb-1">Project Applications</h4>
                            <p className="text-green-300/90 text-base">Join our elite AI project teams</p>
                          </div>
                          <p className="text-white/80 text-base mb-6 leading-relaxed text-center">
                            Apply to work on cutting-edge AI projects with our experienced teams. This is our most selective and prestigious program, offering real-world experience and mentorship opportunities.
                          </p>
                          <div className="flex items-center justify-center">
                            <div className="text-green-300 text-base font-medium">
                              Apply for Projects
                            </div>
                          </div>
                        </motion.a>
                      </motion.div>

                      {/* SECONDARY: Interest Form - Smaller, secondary styling */}
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-px bg-white/20 flex-1"></div>
                          <span className="text-white/60 text-sm">Or</span>
                          <div className="h-px bg-white/20 flex-1"></div>
                        </div>
                        
                        <motion.a
                          href="https://abgumich.org/forms/abg-fall-2025-general-membership-form"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block backdrop-blur-sm border-2 border-blue-300/40 hover:border-blue-300/60 bg-gradient-to-r from-blue-500/15 to-purple-500/15 hover:from-blue-500/25 hover:to-purple-500/25 rounded-xl p-6 text-white font-bold transition-all duration-300 transform hover:scale-[1.01] shadow-lg"
                          whileHover={{ 
                            scale: 1.01,
                            boxShadow: "0 15px 25px rgba(59, 130, 246, 0.2)"
                          }}
                        >
                          <div className="text-center mb-3">
                            <h4 className="text-lg font-bold text-blue-200">General Interest Form</h4>
                            <p className="text-blue-300/70 text-sm">Stay updated on opportunities</p>
                          </div>
                          <p className="text-white/70 text-sm mb-4 leading-relaxed text-center">
                            Not ready to apply for projects yet? Fill out our interest form to stay updated on future opportunities, events, and become a general member positions.
                          </p>
                          <div className="flex items-center justify-center text-blue-300 text-sm font-medium">
                            Join as a General Member
                          </div>
                        </motion.a>
                      </motion.div>
                    </div>

                    {/* Additional info */}
                    <motion.div 
                      className="text-center mt-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                    >
                      <p className="text-white/60 text-sm">
                        Questions? Reach out to us at{' '}
                        <a href="mailto:ContactABG@umich.edu" className="text-blue-300 hover:text-blue-200 underline">
                          ContactABG@umich.edu
                        </a>
                      </p>
                    </motion.div>
                  </motion.div>
                ) : isPoweredDown && !showVideo ? (
                  // During powerdown phase - show nothing (black screen/reboot/logo overlays handle this)
                  <div key="powerdown-waiting" />
                ) : null}
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div> 
        </div>
        
        {/* Simplified CSS for basic animations */}
        <style jsx>{`
          @keyframes borderPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          
          @keyframes glitchShake {
            0% { transform: translate(0); }
            10% { transform: translate(-2px, -1px); }
            20% { transform: translate(2px, 1px); }
            30% { transform: translate(-1px, 2px); }
            40% { transform: translate(1px, -1px); }
            50% { transform: translate(-2px, 1px); }
            60% { transform: translate(2px, -2px); }
            70% { transform: translate(-1px, 1px); }
            80% { transform: translate(1px, 2px); }
            90% { transform: translate(-2px, -1px); }
            100% { transform: translate(0); }
          }
          
          @keyframes digitalNoise {
            0% { filter: brightness(1) contrast(1); }
            25% { filter: brightness(1.1) contrast(1.2) saturate(1.3); }
            50% { filter: brightness(0.9) contrast(1.1) saturate(0.8); }
            75% { filter: brightness(1.05) contrast(1.15) saturate(1.1); }
            100% { filter: brightness(1) contrast(1); }
          }
          
          .border-pulse {
            animation: borderPulse 2s infinite;
          }
          
          .glitch-shake {
            animation: glitchShake 0.5s infinite;
          }
          
          .glitch-transition {
            animation: glitchShake 0.1s ease-in-out infinite;
          }
          
          .digital-distort {
            animation: digitalNoise 0.3s ease-in-out infinite;
          }
          
          /* COMPLETELY ISOLATED COUNTDOWN OVERLAY */
          .countdown-isolated-overlay {
            transform: none !important;
            will-change: auto !important;
            animation: none !important;
            transition: none !important;
            filter: none !important;
            opacity: 1 !important;
            backface-visibility: hidden !important;
            isolation: isolate !important;
            contain: layout style paint !important;
            position: relative !important;
          }
          
          .countdown-isolated-overlay,
          .countdown-isolated-overlay *,
          .countdown-isolated-overlay *::before,
          .countdown-isolated-overlay *::after {
            transform: none !important;
            will-change: auto !important;
            animation: none !important;
            transition: none !important;
            filter: none !important;
            opacity: 1 !important;
            backface-visibility: hidden !important;
          }
        `}</style>
      </section>

      {/* Recruitment Timeline Section */}
      <section id="recruitment-timeline" className="py-16">
        {/* Header with normal container */}
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Recruitment Events
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Join us for these important recruitment events throughout the application process.
            </p>
          </motion.div>
        </div>

        {recruitmentEvents.length > 0 ? (
            <>
              {/* Full-width Horizontal Timeline Container */}
              <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 overflow-hidden">
                {/* Fade gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 lg:w-12 bg-gradient-to-r from-[#00274c]/95 via-[#00274c]/80 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 lg:w-12 bg-gradient-to-l from-[#00274c]/95 via-[#00274c]/80 to-transparent z-10 pointer-events-none"></div>
                
                {/* Scrollable Timeline */}
                <div className="overflow-x-auto pb-4 scrollbar-hide" id="timeline-container">
                  <div className="flex gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 min-w-max">
                    {recruitmentEvents
                      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                      .map((event, index) => {
                        const isPast = new Date(event.eventDate) < currentTime;
                        const isLive = liveEvent?.id === event.id;
                        const isNext = nextEvent?.id === event.id;
                        
                        // Determine scale based on priority: Live > Next (only if no live) > Others
                        const getEventScale = () => {
                          if (isLive) return 'scale-105 sm:scale-110 lg:scale-115 transform'; // Moderate scaling for live events to prevent clipping
                          if (isNext && !liveEvent) return 'scale-102 sm:scale-105 lg:scale-110 transform'; // Slightly bigger for next, but only if no live event
                          if (isNext && liveEvent) return 'scale-100 transform'; // Normal size if next but there's a live event
                          if (isPast) return 'scale-90 sm:scale-95 opacity-70'; // Smaller for past events
                          return 'scale-95 sm:scale-100'; // Default for future events
                        };

                        // Determine card width based on event priority
                        const getCardWidth = () => {
                          if (isLive) return 'w-72 sm:w-80 lg:w-96'; // Wider for live events
                          return 'w-64 sm:w-72 lg:w-80'; // Standard width for others
                        };
                        
                        const isFocused = isLive || (isNext && !liveEvent); // Only focused if live OR (next AND no live event)
                        
                        // Add extra spacing after live events when there's a next event
                        const getExtraSpacing = () => {
                          if (isLive && nextEvent && index < recruitmentEvents.length - 1) {
                            const nextEventIndex = recruitmentEvents.findIndex(e => e.id === nextEvent.id);
                            if (nextEventIndex === index + 1) return 'mr-2 sm:mr-4 lg:mr-6'; // Extra margin if next event is immediately after live
                          }
                          return '';
                        };
                        
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`relative flex-shrink-0 ${isFocused ? 'z-20' : 'z-10'} ${getExtraSpacing()}`}
                            data-event-id={event.id}
                          >
                            {/* Timeline line connecting events */}
                            {index < recruitmentEvents.length - 1 && (
                              <div className="absolute top-1/2 -right-3 sm:-right-4 lg:-right-6 w-3 sm:w-4 lg:w-6 h-0.5 bg-gradient-to-r from-blue-400/50 to-blue-400/20 transform -translate-y-1/2"></div>
                            )}

                            {/* Event Card */}
                            <div className={`relative transition-all duration-500 ${getCardWidth()} ${getEventScale()}`}>
                              {/* Timeline dot */}
                              <div className={`absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 sm:border-4 border-[#00274c] z-20 ${
                                isLive ? 'bg-red-400 animate-pulse shadow-red-400/50 shadow-lg' :
                                isNext ? 'bg-blue-400 shadow-blue-400/50 shadow-lg animate-pulse' :
                                isPast ? 'bg-gray-400' : 'bg-purple-400'
                              }`}></div>

                                {/* Event content */}
                              <div className={`backdrop-blur-lg border rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col transition-all duration-1000 ${
                                isLive ? 'bg-red-500/15 border-red-300/40 shadow-red-500/20 shadow-xl' :
                                isNext ? 'bg-blue-500/15 border-blue-300/40 shadow-blue-500/20 shadow-xl' :
                                isPast ? 'bg-gray-500/10 border-gray-300/20' :
                                `${themeColors.cardBg} ${themeColors.glowColor}`
                              }`}>
                                {/* Status badges */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    {isLive && (
                                      <span className="bg-red-500/20 text-red-300 px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                                        🔴 LIVE NOW
                                      </span>
                                    )}
                                    {isNext && !isLive && (
                                      <span className="bg-blue-500/20 text-blue-300 px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        ⏰ NEXT UP
                                      </span>
                                    )}
                                    {isPast && (
                                      <span className="bg-gray-500/20 text-gray-300 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                                        ✓ COMPLETED
                                      </span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider self-start sm:self-auto ${
                                    event.eventType === 'RECRUITMENT' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {event.eventType}
                                  </span>
                                </div>

                                {/* Event title */}
                                <h3 className={`font-bold text-white mb-2 sm:mb-3 line-clamp-2 ${
                                  isLive ? 'text-lg sm:text-xl lg:text-2xl' : 'text-base sm:text-lg lg:text-xl'
                                }`}>
                                  {event.title}
                                </h3>

                                {/* Event details */}
                                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-medium">{convertUtcToEst(new Date(event.eventDate)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">{convertUtcToEst(new Date(event.eventDate)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} EST</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      <span className="font-medium truncate">{event.location}</span>
                                    </div>
                                  )}
                                  {event.capacity && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span className="font-medium">{event.capacity} spots</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Event description */}
                                <div className="text-white/90 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-1">
                                  <p className={expandedDescriptions[event.id] ? '' : 'line-clamp-3'}>
                                    {expandedDescriptions[event.id] 
                                      ? parseLinksInDescription(event.description)
                                      : getTruncatedDescription(event.description)
                                    }
                                  </p>
                                  {isDescriptionLong(event.description) && (
                                    <button
                                      onClick={() => toggleDescription(event.id)}
                                      className="mt-2 text-blue-300 hover:text-blue-200 text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                      {expandedDescriptions[event.id] ? (
                                        <>
                                          <span>Show Less</span>
                                          <svg className="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                          </svg>
                                        </>
                                      ) : (
                                        <>
                                          <span>Show More</span>
                                          <svg className="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Countdown for next event */}
                                {isNext && !isLive && (
                                  <div className="bg-black/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4 text-center">
                                    <div className="text-base sm:text-lg font-mono font-bold text-blue-300 mb-1">
                                      {formatTimeUntil(new Date(event.eventDate))}
                                    </div>
                                    <div className="text-xs text-white/60 uppercase tracking-wider">
                                      UNTIL START
                                    </div>
                                  </div>
                                )}

                                {/* Registration section */}
                                {event.registrationEnabled && (
                                  <div className="mb-3 sm:mb-4">
                                    <a
                                      href={`/events/${generateSlug(event.title)}`}
                                      className={`w-full bg-gradient-to-r ${themeColors.buttonBg} ${themeColors.textAccent} px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 border border-opacity-20 shadow-lg`}
                                    >
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      {event.registrationCtaLabel || 'View Event & Register'}
                                    </a>
                                  </div>
                                )}

                                {/* Attendance section - now links to event page */}
                                {event.attendanceConfirmEnabled && (
                                  <div className="mt-auto">
                                    <a
                                      href={`/events/${generateSlug(event.title)}`}
                                      className={`w-full bg-gradient-to-r ${themeColors.buttonBg} ${themeColors.textAccent} px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg`}
                                    >
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      View Event Details
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </div>
              
              {/* Navigation hints */}
              <div className="flex justify-center mt-4 sm:mt-6 text-white/60 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span className="hidden sm:inline">Scroll to see all events</span>
                  <span className="sm:hidden">Swipe to browse</span>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </>
          ) : timeline ? (
            // Fallback to CMS timeline if no recruitment events
            <div className="grid md:grid-cols-2 gap-8">
              {/* Open Round */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${themeColors.cardBg} backdrop-blur-lg rounded-xl p-8 shadow-lg transition-all duration-1000`}
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  {timeline.openRoundTitle}
                </h3>
                <ul className="space-y-4">
                  {timeline.openItems.map((item, index) => (
                    <li key={index} className="text-white/80 flex items-start">
                      <span className={`${themeColors.textAccent} mr-3 mt-1`}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Closed Round */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${themeColors.cardBg} backdrop-blur-lg rounded-xl p-8 shadow-lg transition-all duration-1000`}
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  {timeline.closedRoundTitle}
                </h3>
                <ul className="space-y-4">
                  {timeline.closedItems.map((item, index) => (
                    <li key={index} className="text-white/80 flex items-start">
                      <span className={`${themeColors.textAccent} mr-3 mt-1`}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">No recruitment events scheduled at this time.</p>
            </div>
          )}
      </section>

      {/* Coffee Chats Section */}
      <section className={`py-16 px-4 ${themeColors.sectionBg} transition-all duration-1000`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Coffee Chats
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Get to know our members in a casual setting. Sign up for a coffee chat 
              to learn more about ABG and ask any questions you might have.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <a
                href="/recruitment/coffee-chats"
                className={`${themeColors.cardBg} hover:bg-opacity-40 backdrop-blur-sm rounded-lg px-8 py-4 text-white font-medium transition-all duration-300 inline-block shadow-lg ${themeColors.glowColor}`}
              >
                View Available Coffee Chats →
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>


            {/* Member Levels Section */}
      {memberLevels && (
        <section className={`py-16 px-4 ${themeColors.sectionBg} transition-all duration-1000`}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                {memberLevels.heroTitle}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* General Member */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${themeColors.cardBg} backdrop-blur-lg rounded-xl p-8 shadow-lg transition-all duration-1000`}
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  {memberLevels.generalTitle}
                </h3>
                <ul className="space-y-4">
                  {memberLevels.generalBullets.map((bullet, index) => (
                    <li key={index} className="text-white/80 flex items-start">
                      <span className={`${themeColors.textAccent} mr-3 mt-1`}>•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Project Team Member */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${themeColors.cardBg} backdrop-blur-lg rounded-xl p-8 shadow-lg transition-all duration-1000`}
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  {memberLevels.projectTitle}
                </h3>
                <ul className="space-y-4">
                  {memberLevels.projectBullets.map((bullet, index) => (
                    <li key={index} className="text-white/80 flex items-start">
                      <span className={`${themeColors.textAccent} mr-3 mt-1`}>•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              {memberLevels.footerLines.map((line, index) => (
                <p key={index} className="text-white/80 mb-4 max-w-4xl mx-auto">
                  {line}
                </p>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      </motion.div> {/* End Content Container */}

      {/* Call to Action */}
      
      {/* Attendance Confirmation Modal */}
      {attendanceModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${themeColors.cardBg} rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl ${themeColors.glowColor} transition-all duration-1000`}
          >
            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${themeColors.buttonBg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${themeColors.glowColor}`}>
                <svg className={`w-8 h-8 ${themeColors.textAccent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Confirm Attendance
              </h3>
              <p className="text-white/80 text-sm mb-1">
                Enter the password to confirm your attendance for:
              </p>
              <p className={`${themeColors.textAccent} font-semibold`}>
                {attendanceModal.eventTitle}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Attendance Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={attendancePassword}
                  onChange={(e) => setAttendancePassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAttendance()}
                  placeholder="Enter password..."
                  className={`w-full px-4 py-3 ${themeColors.cardBg} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all border border-opacity-20`}
                  style={{
                    borderColor: themeColors.textAccent.replace('text-', '').replace('-300', '-400')
                  }}
                  disabled={attendanceLoading}
                  autoFocus
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setAttendanceModal({ show: false, eventId: '', eventTitle: '' });
                  setAttendancePassword('');
                }}
                className="flex-1 px-4 py-3 border border-white/20 rounded-lg text-white/80 hover:bg-white/5 transition-all font-medium"
                disabled={attendanceLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmAttendance}
                disabled={attendanceLoading || !attendancePassword.trim()}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${themeColors.buttonBg} disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2`}
              >
                {attendanceLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-white">Confirming...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Confirm</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
