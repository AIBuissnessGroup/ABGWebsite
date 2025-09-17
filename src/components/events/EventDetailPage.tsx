'use client';

import { useState, useEffect } from 'react';
import { Event, EventAttendance } from '../../types/events';
import CountdownTimer from './CountdownTimer';
import AttendanceForm from './AttendanceForm';
import EventUpdates from './EventUpdates';
import Footer from '../Footer';
import FloatingShapes from '../FloatingShapes';

// Helper function for consistent date formatting
const formatEventDate = (timestamp: number) => {
  const utcDate = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
  };
  return utcDate.toLocaleDateString('en-US', options);
};

const formatEventTime = (timestamp: number) => {
  const utcDate = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  };
  return utcDate.toLocaleTimeString('en-US', options);
};

interface EventDetailPageProps {
  event: Event;
  userRegistration?: EventAttendance | null;
  userEmail?: string;
  eventStats?: {
    confirmedCount: number;
    waitlistCount: number;
  };
}

export default function EventDetailPage({ event, userRegistration, userEmail, eventStats }: EventDetailPageProps) {
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [localUserEmail, setLocalUserEmail] = useState(userEmail || '');
  const [isClient, setIsClient] = useState(false);

  // Handle hydration mismatch for date formatting
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleExportToCalendar = () => {
    const googleCalendarUrl = generateGoogleCalendarUrl(event);
    window.open(googleCalendarUrl, '_blank');
  };

  const canRegister = (!!event.registrationEnabled || !!event.attendanceConfirmEnabled) && !userRegistration;
  
  const eventDate = new Date(event.eventDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isUpcoming = eventDate.getTime() > Date.now();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative min-h-screen h-auto bg-black overflow-hidden">
        {event.imageUrl && (
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover filter blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        <FloatingShapes variant="minimal" opacity={0.08} />
        <div className="absolute inset-0 flex items-center justify-center py-12 md:py-16">
          <div className="text-center text-white max-w-4xl px-4 py-4 w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-3 md:mb-4 tracking-wide leading-tight">
              {event.title}
            </h1>
            
            {/* Speakers and Partners under title - mobile friendly */}
            <div className="mb-3 md:mb-4 space-y-3 md:space-y-4">
              {/* Event Speakers */}
              {event.speakers && event.speakers.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">Speakers</h3>
                  {/* Mobile: 2 per row, Desktop: horizontal scroll */}
                  <div className="grid grid-cols-2 gap-2 sm:hidden">
                    {event.speakers
                      .sort((a, b) => a.order - b.order)
                      .map((speaker, index) => (
                        <div key={speaker.id || index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-center">
                          {speaker.photo && (
                            <div className="mb-1">
                              <img 
                                src={speaker.photo} 
                                alt={speaker.name}
                                className="w-8 h-8 rounded-full mx-auto object-cover border-2 border-white/30"
                              />
                            </div>
                          )}
                          <div className="text-white text-xs font-medium leading-tight">{speaker.name}</div>
                          <div className="text-gray-300 text-xs leading-tight break-words">{speaker.title}</div>
                          <div className="text-gray-400 text-xs leading-tight">{speaker.company}</div>
                        </div>
                      ))}
                  </div>
                  {/* Desktop: horizontal scroll */}
                  <div className="hidden sm:flex justify-center gap-2 md:gap-3 overflow-x-auto pb-2">
                    {event.speakers
                      .sort((a, b) => a.order - b.order)
                      .map((speaker, index) => (
                        <div key={speaker.id || index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 md:p-3 text-center flex-shrink-0 min-w-[160px] max-w-[200px]">
                          {speaker.photo && (
                            <div className="mb-1 md:mb-2">
                              <img 
                                src={speaker.photo} 
                                alt={speaker.name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full mx-auto object-cover border-2 border-white/30"
                              />
                            </div>
                          )}
                          <div className="text-white text-xs font-medium leading-tight">{speaker.name}</div>
                          <div className="text-gray-300 text-xs leading-tight break-words">{speaker.title}</div>
                          <div className="text-gray-400 text-xs leading-tight">{speaker.company}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
                          
              {/* Event Partners */}
              {event.partners && event.partners.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">Event Partners</h3>
                  <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                    {event.partners.map((partner, index) => (
                      <div key={partner.id || index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1.5 md:px-3 md:py-2 flex items-center flex-shrink-0">
                        {partner.logo ? (
                          <img 
                            src={partner.logo} 
                            alt={partner.name}
                            className="max-h-12 md:max-h-16 max-w-16 md:max-w-20 object-contain filter brightness-90"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{partner.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-events Section */}
              {event.subevents && event.subevents.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">Subevents</h3>
                  <div className="space-y-2">
                    {event.subevents
                      .sort((a, b) => a.eventDate - b.eventDate)
                      .map((subevent, index) => (
                        <div key={subevent.id || index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 md:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="text-white text-sm md:text-base font-medium leading-tight">{subevent.title}</h4>
                              <p className="text-gray-300 text-xs md:text-sm leading-tight mt-1">{subevent.description}</p>
                            </div>
                            <div className="flex flex-col sm:items-end gap-1 text-xs md:text-sm">
                              <div className="text-gray-300">
                                {isClient ? formatEventTime(subevent.eventDate) : 'Loading...'}
                              </div>
                              {subevent.venue && (
                                <div className="text-gray-400 text-xs">📍 {subevent.venue}</div>
                              )}
                              <div className="text-gray-400 text-xs">
                                <span className="px-2 py-1 bg-white/10 rounded-full">{subevent.eventType}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-4 md:mt-6 px-4">
              <button
                onClick={handleExportToCalendar}
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-light hover:bg-white/20 transition-all duration-300 text-sm md:text-base"
              >
                Add to Google Calendar
              </button>
              {canRegister && isUpcoming && (
                <button
                  onClick={() => setShowAttendanceForm(true)}
                  className="w-full sm:w-auto bg-white text-black px-6 md:px-8 py-2.5 md:py-3 rounded-full font-medium hover:bg-gray-100 transition-all duration-300 text-sm md:text-base"
                >
                  Register
                </button>
              )}
            </div>
            
            {/* Scroll to explore indicator - positioned after buttons */}
            <div className="flex justify-center mt-8 md:mt-12">
              <div className="flex flex-col items-center gap-2 cursor-pointer animate-bounce">
                <span className="text-xs text-[#BBBBBB] uppercase tracking-wider">Scroll to explore</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-[#BBBBBB]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-gray-900">
        <FloatingShapes variant="minimal" opacity={0.05} />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8 md:space-y-12">
              
              {/* Entry Pass - Different for Confirmed vs Waitlisted */}
              {userRegistration && (
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/15 via-purple-600/10 to-indigo-600/15 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 md:p-5 shadow-lg">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-3">
                    <div className="absolute top-2 left-2 w-8 h-8 border border-blue-400 rounded-full"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border border-purple-400 rounded-lg rotate-45"></div>
                  </div>
                  
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {userRegistration.status === 'confirmed' ? (
                        <>
                          {/* Confirmed User - Show Entry Pass */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm">🎫</span>
                            </div>
                            <div>
                              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Event Entry Pass
                              </h2>
                            </div>
                          </div>

                          {/* Entry Code */}
                          <div className="bg-black/40 border border-blue-400/50 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-blue-300/70 text-xs font-medium">ENTRY CODE</p>
                              <p className="text-2xl font-mono font-black text-blue-300 tracking-[0.15em] mt-1">
                                {(() => {
                                  const emailHash = userEmail ? userEmail.split('@')[0].slice(-4).toUpperCase() : '0000';
                                  const eventCode = event.id.slice(-2).toUpperCase();
                                  return `ABG-${eventCode}${emailHash}`;
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Instructions */}
                          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                            <span className="text-blue-400 text-sm">📱</span>
                            <p className="text-blue-300/90 text-xs">
                              Show to ABG exec at entrance
                            </p>
                          </div>

                          {/* Status */}
                          <div className="flex gap-2 text-xs">
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-md border border-green-500/30 font-medium">
                              Confirmed
                            </span>
                            <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-md border border-gray-500/30">
                              {new Date(userRegistration.registeredAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                            </span>
                          </div>
                        </>
                      ) : userRegistration.status === 'attended' ? (
                        <>
                          {/* Attended User - Show Check-in Confirmation */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                            <div>
                              <h2 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                Check-in Confirmed
                              </h2>
                            </div>
                          </div>

                          {/* Check-in Success Message */}
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                            <div className="text-center">
                              <p className="text-green-300 font-bold text-lg mb-2">
                                ✨ You're checked in! ✨
                              </p>
                              <p className="text-green-200/90 text-sm leading-relaxed">
                                Great job attending the event! Your participation has been recorded.
                              </p>
                            </div>
                          </div>

                          {/* Check-in Details */}
                          <div className="bg-black/40 border border-green-400/50 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-green-300/70 text-xs font-medium">CHECK-IN TIME</p>
                              <p className="text-lg font-semibold text-green-300 mt-1">
                                {userRegistration.attendedAt ? 
                                  new Date(userRegistration.attendedAt).toLocaleString('en-US', { 
                                    timeZone: 'America/New_York',
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  }) 
                                  : 'Check-in time not recorded'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Thank you message */}
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400 text-sm">🙏</span>
                              <div>
                                <p className="text-blue-300 text-sm font-medium mb-1">Thank you for attending!</p>
                                <p className="text-blue-200/90 text-xs">
                                  We hope you enjoyed the event. Stay tuned for more ABG events!
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex gap-2 text-xs">
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-md border border-green-500/30 font-medium">
                              ✓ Attended
                            </span>
                            <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-md border border-gray-500/30">
                              Registered: {new Date(userRegistration.registeredAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Waitlisted User - Show Waitlist Message */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm">⏳</span>
                            </div>
                            <div>
                              <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                Waitlist Status
                              </h2>
                            </div>
                          </div>

                          {/* Waitlist Message */}
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                            <div className="text-center">
                              <p className="text-yellow-300 font-bold text-lg mb-2">
                                You're #{userRegistration.waitlistPosition} on the waitlist
                              </p>
                              <p className="text-yellow-200/90 text-sm leading-relaxed">
                                Please check back consistently! If space opens up, an event entry code will appear here.
                              </p>
                            </div>
                          </div>

                          {/* Contact Information */}
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400 text-sm">📧</span>
                              <div>
                                <p className="text-blue-300 text-sm font-medium mb-1">Questions?</p>
                                <p className="text-blue-200/90 text-xs">
                                  Contact us at{' '}
                                  <a href="mailto:ContactABG@umich.edu" className="text-blue-300 hover:text-blue-200 underline">
                                    ContactABG@umich.edu
                                  </a>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex gap-2 text-xs">
                            <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md border border-yellow-500/30 font-medium">
                              Waitlist #{userRegistration.waitlistPosition}
                            </span>
                            <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-md border border-gray-500/30">
                              {new Date(userRegistration.registeredAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Cancel Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={async () => {
                          if (confirm('Cancel registration?')) {
                            try {
                              const response = await fetch(`/api/events/${event.slug}/attendance?email=${encodeURIComponent(userEmail || '')}`, {
                                method: 'DELETE'
                              });
                              const result = await response.json();
                              if (response.ok) {
                                alert(result.message);
                                window.location.reload();
                              } else {
                                alert(`Error: ${result.error}`);
                              }
                            } catch (error) {
                              console.error('Cancel registration error:', error);
                              alert('Failed to cancel registration');
                            }
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                      >
                        <span className="text-red-400">✕</span>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Updates */}
              {event.updates?.history && event.updates.history.length > 0 && (
                <EventUpdates updates={event.updates.history} />
              )}
              
              {/* Event Details with Countdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Details Section - Left Side */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl md:text-3xl font-light text-white mb-6 md:mb-8 border-b border-gray-700 pb-3 md:pb-4">Details</h2>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light">
                    {event.description}
                  </p>
                </div>
                
                {/* Countdown Timer - Right Side */}
                {isUpcoming && (
                  <div className="flex justify-center md:justify-end items-start">
                    <div className="w-full max-w-xs">
                      <CountdownTimer targetDate={eventDate} />
                    </div>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <h3 className="text-lg md:text-xl font-light text-white mb-2 md:mb-3">When</h3>
                  <p className="text-gray-300 font-light text-sm md:text-base">
                    {isClient ? (
                      formatEventDate(event.eventDate)
                    ) : (
                      'Loading date...'
                    )}
                  </p>
                  <p className="text-gray-400 font-light text-sm md:text-base">
                    {isClient ? (
                      <>
                        {formatEventTime(event.eventDate)}
                        {event.endDate && ` - ${formatEventTime(event.endDate)}`}
                      </>
                    ) : (
                      'Loading time...'
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg md:text-xl font-light text-white mb-2 md:mb-3">Where</h3>
                  <p className="text-gray-300 font-light text-sm md:text-base">{event.location}</p>
                  {event.venue && (
                    <p className="text-gray-400 font-light text-sm md:text-base">{event.venue}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/60 via-gray-900/50 to-black/40 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-6 shadow-2xl lg:sticky lg:top-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-600/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Event Status
                  </h3>
                </div>
                
                {/* Registration Button */}
                {isUpcoming && (
                  <div className="space-y-4">
                    {canRegister ? (
                      <button
                        onClick={() => setShowAttendanceForm(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🎫</span>
                        Register Now
                      </button>
                    ) : userRegistration ? (
                      <div className={`text-center font-medium py-4 rounded-xl border-2 shadow-lg ${
                        userRegistration.status === 'waitlisted' 
                          ? 'text-yellow-300 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 shadow-yellow-500/20' 
                          : 'text-green-300 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-green-500/20'
                      }`}>
                        {userRegistration.status === 'waitlisted' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg">⏳</span>
                              <span className="font-bold">On Waitlist</span>
                            </div>
                            {userRegistration.waitlistPosition && (
                              <div className="text-sm opacity-80 bg-yellow-500/10 rounded-lg py-1 px-3 border border-yellow-500/20">
                                Position #{userRegistration.waitlistPosition} in queue
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">✅</span>
                            <span className="font-bold">Attendance Confirmed</span>
                          </div>
                        )}
                      </div>
                    ) : !(event.registrationEnabled || event.attendanceConfirmEnabled) ? (
                      <div className="text-center text-gray-400 py-4 rounded-xl border-2 border-gray-600/30 bg-gray-500/10">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-lg">🔒</span>
                          <span className="font-semibold">Registration Closed</span>
                        </div>
                        <p className="text-sm opacity-75">No longer accepting registrations</p>
                      </div>
                    ) : event.waitlist?.enabled && eventStats && event.waitlist.maxSize && eventStats.waitlistCount < event.waitlist.maxSize ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowAttendanceForm(true)}
                          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25 flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">⏳</span>
                          Join Waitlist
                        </button>
                        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3 text-center">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                              <p className="text-green-400 font-bold">{eventStats.confirmedCount}</p>
                              <p className="text-green-300/70">Confirmed</p>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                              <p className="text-yellow-400 font-bold">{eventStats.waitlistCount}</p>
                              <p className="text-yellow-300/70">Waitlisted</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-xs mt-2">
                            {event.waitlist.maxSize - eventStats.waitlistCount} waitlist spots remaining
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-red-300 py-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl border-2 border-red-500/30 shadow-lg shadow-red-500/20">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-lg">🚫</span>
                            <span className="font-bold">{event.waitlist?.enabled ? 'Event & Waitlist Full' : 'Event Full'}</span>
                          </div>
                          <p className="text-sm opacity-75">No spots available</p>
                        </div>
                        {event.waitlist?.enabled && eventStats && (
                          <div className="mt-3 bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                                <p className="text-green-400 font-bold">{eventStats.confirmedCount}</p>
                                <p className="text-green-300/70">Confirmed</p>
                              </div>
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                                <p className="text-yellow-400 font-bold">{eventStats.waitlistCount}</p>
                                <p className="text-yellow-300/70">Waitlisted</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!isUpcoming && (
                  <div className="text-center text-gray-400 py-4 bg-gray-500/10 rounded-xl border-2 border-gray-600/30">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">📅</span>
                      <span className="font-semibold">Event Ended</span>
                    </div>
                    <p className="text-sm opacity-75 mt-1">This event has concluded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Form Modal */}
      {showAttendanceForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <AttendanceForm
              event={event}
              initialEmail={localUserEmail}
              onSuccess={(email: string) => {
                setLocalUserEmail(email);
                setShowAttendanceForm(false);
                window.location.reload(); // Refresh to show updated status
              }}
              onCancel={() => setShowAttendanceForm(false)}
            />
          </div>
        </div>
      )}

      <div className="bg-gray-900">
        <Footer />
      </div>
    </div>
  );
}

// Helper functions
function generateGoogleCalendarUrl(event: Event): string {
  // The event.eventDate is stored as UTC in the database
  // But it represents an EST time, so we need to convert it properly for Google Calendar
  const utcStartDate = new Date(event.eventDate);
  const utcEndDate = event.endDate ? new Date(event.endDate) : new Date(utcStartDate.getTime() + 2 * 60 * 60 * 1000);
  
  // Convert UTC to EST (subtract 5 hours) to get the actual intended time
  const estOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  const estStartDate = new Date(utcStartDate.getTime() - estOffset);
  const estEndDate = new Date(utcEndDate.getTime() - estOffset);
  
  // Format for Google Calendar with EST timezone
  const formatDateForGoogle = (date: Date) => {
    // Use the EST date but format as if it's local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Return in format YYYYMMDDTHHMMSS for local time
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateForGoogle(estStartDate)}/${formatDateForGoogle(estEndDate)}`,
    details: event.description,
    location: `${event.location}${event.venue ? ', ' + event.venue : ''}`,
    sprop: 'website:abg-website.com'
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}