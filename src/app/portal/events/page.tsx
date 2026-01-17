'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { RecruitmentEvent, EventRsvp, PortalDashboard } from '@/types/recruitment';

export default function PortalEventsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [events, setEvents] = useState<RecruitmentEvent[]>([]);
  const [myRsvps, setMyRsvps] = useState<string[]>([]);
  const [checkedInEvents, setCheckedInEvents] = useState<string[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  
  // Check-in modal state
  const [checkInEvent, setCheckInEvent] = useState<RecruitmentEvent | null>(null);
  const [checkInPhoto, setCheckInPhoto] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/dashboard');
      if (!res.ok) throw new Error('Failed to load');
      const data: PortalDashboard = await res.json();
      setDashboard(data);
      setEvents(data.upcomingEvents || []);
      setMyRsvps(data.myRsvps?.map(r => r.eventId) || []);
      setCheckedInEvents(data.myRsvps?.filter(r => r.checkedInAt).map(r => r.eventId) || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (eventId: string) => {
    if (!dashboard?.activeCycle) return;
    
    try {
      setRsvpLoading(eventId);
      const res = await fetch('/api/portal/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: dashboard.activeCycle._id,
          eventId,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to RSVP');
      }
      
      setMyRsvps(prev => [...prev, eventId]);
      toast.success('RSVP confirmed!');
    } catch (error) {
      console.error('RSVP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to RSVP');
    } finally {
      setRsvpLoading(null);
    }
  };

  const handleCancelRsvp = async (eventId: string) => {
    if (!dashboard?.activeCycle) return;
    if (!confirm('Cancel your RSVP for this event?')) return;
    
    try {
      setRsvpLoading(eventId);
      const res = await fetch(`/api/portal/rsvp?eventId=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel');
      }
      
      setMyRsvps(prev => prev.filter(id => id !== eventId));
      toast.success('RSVP cancelled');
    } catch (error) {
      console.error('Cancel RSVP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel');
    } finally {
      setRsvpLoading(null);
    }
  };

  // Start camera for check-in
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true); // Set active immediately to show video element
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      
      // Small delay to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Could not access camera. Please allow camera permissions.');
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Use actual video dimensions, fallback to display dimensions
    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;
    
    console.log('Capturing photo, dimensions:', width, height);
    
    if (width === 0 || height === 0) {
      toast.error('Camera not ready, please wait a moment and try again');
      return;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Reset transform first
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Mirror the image for selfie view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Photo captured, data length:', photoData.length);
      setCheckInPhoto(photoData);
      stopCamera();
    }
  };

  // Cleanup camera when modal closes
  const closeCheckInModal = () => {
    stopCamera();
    setCheckInEvent(null);
    setCheckInPhoto(null);
    setCameraError(null);
  };

  // Handle check-in submission
  const handleCheckIn = async () => {
    if (!checkInEvent) {
      return;
    }

    if (!checkInPhoto) {
      toast.error('Please take a photo to check in');
      return;
    }

    try {
      setCheckInLoading(true);
      const res = await fetch('/api/portal/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: checkInEvent._id,
          photo: checkInPhoto,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      // Add to checked in list and auto-add to RSVPs (in case auto-RSVP happened)
      setCheckedInEvents(prev => [...prev, checkInEvent._id!]);
      if (!myRsvps.includes(checkInEvent._id!)) {
        setMyRsvps(prev => [...prev, checkInEvent._id!]);
      }
      setCheckInEvent(null);
      setCheckInPhoto(null);
      toast.success('Successfully checked in! 🎉');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const formatEventDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });
  };

  const isEventPast = (event: RecruitmentEvent): boolean => {
    return new Date(event.endAt) < new Date();
  };

  const isEventOngoing = (event: RecruitmentEvent): boolean => {
    const now = new Date();
    return new Date(event.startAt) <= now && new Date(event.endAt) > now;
  };

  // Check if check-in should be available: event has started but not ended
  const canCheckIn = (event: RecruitmentEvent): boolean => {
    const now = new Date();
    const hasStarted = new Date(event.startAt) <= now;
    const hasNotEnded = new Date(event.endAt) > now;
    return event.checkInEnabled === true && hasStarted && hasNotEnded;
  };

  // Generate Google Calendar link for an event
  const getGoogleCalendarLink = (event: RecruitmentEvent): string => {
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);
    
    // Format dates as YYYYMMDDTHHMMSSZ
    const formatGcalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGcalDate(startDate)}/${formatGcalDate(endDate)}`,
      details: event.description || `ABG Recruitment Event`,
      location: event.location || event.venue || '',
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!dashboard?.activeCycle) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-8 text-center">
        <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Current Recruitment Cycles</h2>
        <p className="text-gray-600">There are no current cycles to apply to. Events will appear when recruitment opens.</p>
      </div>
    );
  }

  // Separate ongoing, upcoming, and past events
  // Sort upcoming events by startAt ascending (soonest first)
  // Sort past events by startAt descending (most recent first)
  const ongoingEvents = events.filter(e => isEventOngoing(e))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const upcomingEvents = events.filter(e => !isEventPast(e) && !isEventOngoing(e))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const pastEvents = events.filter(e => isEventPast(e))
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  return (
    <div className="space-y-8">
      <div style={{ color: '#111827' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Recruitment Events</h1>
        <p className="text-gray-600">
          RSVP to events to learn more about ABG and meet our members
        </p>
      </div>

      {/* Ongoing Events - Happening Now */}
      {ongoingEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#111827' }}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Happening Now
          </h2>
          <div className="space-y-4">
            {ongoingEvents.map((event) => {
              const hasRsvp = myRsvps.includes(event._id!);
              const isLoading = rsvpLoading === event._id;
              
              return (
                <div
                  key={event._id}
                  className="bg-white rounded-xl border-2 border-green-400 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Live Now
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            event.eventType === 'info_session' ? 'bg-blue-100 text-blue-700' :
                            event.eventType === 'social' ? 'bg-purple-100 text-purple-700' :
                            event.eventType === 'workshop' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {(event.eventType || 'other').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                          {event.isRequired && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>
                          {event.title}
                        </h3>
                        
                        {event.description && (
                          <p className="text-gray-600 mb-4">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            {formatEventDate(String(event.startAt))}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {checkedInEvents.includes(event._id!) ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Checked In ✓
                          </span>
                        ) : canCheckIn(event) ? (
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => setCheckInEvent(event)}
                              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 animate-pulse"
                            >
                              <CameraIcon className="w-4 h-4" />
                              Check In Now
                            </button>
                          </div>
                        ) : hasRsvp ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            RSVP'd
                          </span>
                        ) : event.rsvpEnabled !== false ? (
                          <button
                            onClick={() => handleRsvp(event._id!)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isLoading ? 'RSVPing...' : 'RSVP'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#111827' }}>Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center text-gray-500">
            No upcoming events at this time
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => {
              const hasRsvp = myRsvps.includes(event._id!);
              const isLoading = rsvpLoading === event._id;
              
              return (
                <div
                  key={event._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            event.eventType === 'info_session' ? 'bg-blue-100 text-blue-700' :
                            event.eventType === 'social' ? 'bg-purple-100 text-purple-700' :
                            event.eventType === 'workshop' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {(event.eventType || 'other').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                          {event.isRequired && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>
                          {event.title}
                        </h3>
                        
                        {event.description && (
                          <p className="text-gray-600 mb-4">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            {formatEventDate(String(event.startAt))}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                          {event.endAt && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000)} min
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {checkedInEvents.includes(event._id!) ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Checked In ✓
                          </span>
                        ) : canCheckIn(event) ? (
                          <div className="flex flex-col items-end gap-2">
                            {hasRsvp && (
                              <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                                <CheckCircleIcon className="w-4 h-4" />
                                RSVP'd
                              </span>
                            )}
                            <button
                              onClick={() => setCheckInEvent(event)}
                              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                              <CameraIcon className="w-4 h-4" />
                              Check In
                            </button>
                            {hasRsvp && (
                              <button
                                onClick={() => handleCancelRsvp(event._id!)}
                                disabled={isLoading}
                                className="text-sm text-gray-400 hover:text-red-600"
                              >
                                Cancel RSVP
                              </button>
                            )}
                          </div>
                        ) : hasRsvp ? (
                          <div className="flex flex-col items-end gap-2">
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircleIcon className="w-5 h-5" />
                              RSVP'd
                            </span>
                            <button
                              onClick={() => handleCancelRsvp(event._id!)}
                              disabled={isLoading}
                              className="text-sm text-gray-400 hover:text-red-600"
                            >
                              Cancel
                            </button>
                            <a
                              href={getGoogleCalendarLink(event)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Add to Calendar
                            </a>
                          </div>
                        ) : event.rsvpEnabled !== false ? (
                          <button
                            onClick={() => handleRsvp(event._id!)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isLoading ? 'RSVPing...' : 'RSVP'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {event.rsvpCount !== undefined && event.rsvpEnabled !== false && (
                    <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {event.rsvpCount} {event.rsvpCount === 1 ? 'person' : 'people'} attending
                        {event.capacity && ` • ${event.capacity - event.rsvpCount} spots left`}
                      </span>
                      {!myRsvps.includes(event._id!) && (
                        <a
                          href={getGoogleCalendarLink(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <CalendarDaysIcon className="w-4 h-4" />
                          Add to Calendar
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-4">Past Events</h2>
          <div className="space-y-3 opacity-60">
            {pastEvents.map((event) => {
              const hadRsvp = myRsvps.includes(event._id!);
              const rsvpData = dashboard?.myRsvps?.find(r => r.eventId === event._id);
              
              return (
                <div
                  key={event._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatEventDate(String(event.startAt))}
                      </p>
                    </div>
                    {hadRsvp && (
                      <span className={`flex items-center gap-1 text-sm ${
                        rsvpData?.attendedAt ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {rsvpData?.attendedAt ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Attended
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="w-4 h-4" />
                            Did not attend
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {checkInEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Check In to Event</h3>
              <button
                onClick={closeCheckInModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Take a selfie at <strong>{checkInEvent.title}</strong> to confirm your attendance.
            </p>

            <div className="space-y-4">
              {/* Hidden canvas for capturing */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera / Photo Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selfie Photo <span className="text-red-500">*</span>
                </label>
                
                {checkInPhoto ? (
                  <div className="relative">
                    <img
                      src={checkInPhoto}
                      alt="Check-in selfie"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setCheckInPhoto(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ minHeight: '256px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer z-10"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full" />
                    </button>
                    <p className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Tap the button to capture
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cameraError && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {cameraError}
                      </div>
                    )}
                    <button
                      onClick={startCamera}
                      className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                    >
                      <CameraIcon className="w-12 h-12" />
                      <span className="font-medium">Open Camera</span>
                      <span className="text-sm">Tap to take a selfie</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading || !checkInPhoto}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkInLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Checking in...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Confirm Check-In
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
