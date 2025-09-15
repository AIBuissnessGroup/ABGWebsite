'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';

interface CheckInData {
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  alreadyCheckedIn?: boolean;
  checkedInAt?: number;
}

export default function SelfCheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const [eventId, setEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [eventData, setEventData] = useState<CheckInData>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Override fetch to debug unexpected requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      console.log('🌐 FETCH REQUEST:', { 
        url, 
        method: options?.method || 'GET',
        isDeleteToAttendance: url.toString().includes('/attendance') && options?.method === 'DELETE',
        fromCheckinPage: true
      });
      
      // Block unexpected DELETE requests to attendance
      if (url.toString().includes('/attendance') && options?.method === 'DELETE') {
        console.error('🚫 BLOCKED UNEXPECTED DELETE REQUEST TO ATTENDANCE API');
        return new Response(JSON.stringify({ error: 'Blocked unexpected request' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.slug);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!eventId) return;

    const checkInCode = searchParams.get('code');
    const attendeeId = searchParams.get('attendee');

    // Verify the QR code data (or just get event info for general QR codes)
    const verifyCode = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (checkInCode) queryParams.set('checkInCode', checkInCode);
        if (attendeeId) queryParams.set('attendeeId', attendeeId);

        const response = await fetch(`/api/events/${eventId}/checkin?${queryParams}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to verify event');
          setLoading(false);
          return;
        }

        setEventData(data);
        setLoading(false);

        if (data.alreadyCheckedIn) {
          setMessage(`You're already checked in! Check-in time: ${new Date(data.checkedInAt).toLocaleString()}`);
        }
      } catch (err) {
        setError('Failed to verify event information');
        setLoading(false);
      }
    };

    verifyCode();
  }, [eventId, searchParams]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setError('');
    } catch (err) {
      setError('Camera access denied. Please allow camera access to check in.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Convert to base64
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoData);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCheckIn = async () => {
    if (status !== 'authenticated') {
      // Redirect to sign in with return URL
      const currentUrl = window.location.href;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Check if we need to capture a photo first
    if (!capturedPhoto) {
      setError('Please take a photo to complete check-in.');
      startCamera();
      return;
    }

    setCheckingIn(true);
    setError('');

    try {
      const checkInCode = searchParams.get('code');
      const attendeeId = searchParams.get('attendee');

      console.log('🔵 CHECK-IN ATTEMPT (not cancel):', { 
        checkInCode, 
        attendeeId, 
        userEmail: session.user?.email,
        eventSlug: eventId,
        apiUrl: `/api/events/${eventId}/checkin`,
        method: 'POST',
        hasPhoto: !!capturedPhoto
      });

      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInCode,
          attendeeId,
          photo: capturedPhoto
        }),
      });

      const data = await response.json();
      console.log('🔵 CHECK-IN RESPONSE:', { 
        status: response.status, 
        ok: response.ok,
        data 
      });

      if (!response.ok) {
        if (data.emailMismatch) {
          setError('This check-in code belongs to a different account. Please sign in with the correct UMich email.');
        } else if (!data.registered) {
          setError('No registration found for this event. Please register first.');
        } else if (data.waitlisted) {
          setError('You are on the waitlist for this event. Only confirmed attendees can check in.');
        } else {
          setError(data.error || 'Check-in failed');
        }
        setCheckingIn(false);
        return;
      }

      if (data.alreadyCheckedIn) {
        setMessage('You are already checked in!');
      } else {
        setMessage(`Successfully checked in to ${data.eventTitle}!`);
        setEventData(prev => ({ ...prev, alreadyCheckedIn: true, checkedInAt: data.checkedInAt }));
      }

    } catch (err) {
      setError('Failed to check in. Please try again.');
    }

    setCheckingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] via-[#1a2c45] to-[#00274c] relative overflow-hidden flex items-center justify-center p-4">
        <FloatingShapes variant="minimal" opacity={0.1} />
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium checkin-subtext">Verifying event information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !eventData.eventTitle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] via-[#1a2c45] to-[#00274c] relative overflow-hidden flex items-center justify-center p-4">
        <FloatingShapes variant="minimal" opacity={0.1} />
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200 relative z-10">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 checkin-title">Unable to Verify Event</h2>
            <p className="text-gray-600 mb-6 leading-relaxed checkin-text">{error}</p>
            <button
              onClick={() => router.push('/events')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View All Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .checkin-title {
          color: #374151 !important;
        }
        .checkin-text {
          color: #374151 !important;
        }
        .checkin-subtext {
          color: #6b7280 !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] via-[#1a2c45] to-[#00274c] relative overflow-hidden flex items-center justify-center p-4">
        <FloatingShapes variant="default" opacity={0.1} />
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200 relative z-10">
        <div className="text-center">
          {/* Event Information */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 checkin-title" style={{ color: '#374151 !important', backgroundColor: 'transparent' }}>Event Check-in</h1>
            <div className="bg-blue-50 p-4 rounded-lg text-left border border-blue-200">
              <h2 className="font-bold text-blue-900 mb-3 text-lg checkin-text">{eventData.eventTitle}</h2>
              {eventData.eventDate && (
                <p className="text-sm text-blue-700 mb-2 flex items-center checkin-text">
                  <span className="mr-2">📅</span>
                  {new Date(eventData.eventDate).toLocaleDateString()}
                </p>
              )}
              {eventData.eventLocation && (
                <p className="text-sm text-blue-700 flex items-center checkin-text">
                  <span className="mr-2">📍</span>
                  {eventData.eventLocation}
                </p>
              )}
            </div>
          </div>

          {/* Authentication Status */}
          {status === 'loading' ? (
            <div className="mb-6">
              <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
              <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4 mx-auto"></div>
            </div>
          ) : status === 'authenticated' ? (
            <div className="mb-6">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700 checkin-text">
                  ✅ Signed in as: {session.user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700 checkin-text">
                  🔐 You need to sign in to check in
                </p>
              </div>
            </div>
          )}

          {/* Camera Section */}
          {status === 'authenticated' && !eventData.alreadyCheckedIn && (
            <div className="mb-6">
              {showCamera && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 checkin-title">Take Check-in Photo</h3>
                  <div className="relative">
                    <video
                      id="camera-video"
                      autoPlay
                      playsInline
                      muted
                      ref={(video) => {
                        if (video && stream) {
                          video.srcObject = stream;
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📸 Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {capturedPhoto && !showCamera && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 checkin-title">Photo Captured ✅</h3>
                  <div className="relative">
                    <img
                      src={capturedPhoto}
                      alt="Check-in photo"
                      className="w-full rounded-lg border border-green-300"
                    />
                  </div>
                  <button
                    onClick={retakePhoto}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    📸 Retake Photo
                  </button>
                </div>
              )}

              {!capturedPhoto && !showCamera && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 checkin-title">Photo Required</h3>
                  <p className="text-sm text-blue-700 mb-3 checkin-text">
                    📸 Please take a photo to complete your check-in
                  </p>
                  <button
                    onClick={startCamera}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    📷 Start Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 checkin-text">{message}</p>
              </div>
            </div>
          )}

          {error && eventData.eventTitle && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 checkin-text">{error}</p>
              </div>
            </div>
          )}

          {/* Check-in Button */}
          {!eventData.alreadyCheckedIn && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn || !capturedPhoto}
              data-action="check-in"
              data-event-slug={eventId}
              className={`w-full py-4 px-6 rounded-lg transition-colors font-bold text-lg shadow-lg ${
                !capturedPhoto 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : checkingIn 
                    ? 'bg-blue-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {checkingIn ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing Check-in...
                </span>
              ) : !capturedPhoto ? (
                '📸 Take Photo First'
              ) : status === 'authenticated' ? (
                '✓ Check In to Event'
              ) : (
                'Sign In to Check In'
              )}
            </button>
          )}

          {eventData.alreadyCheckedIn && (
            <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg shadow-inner">
              <div className="text-green-600 text-5xl mb-3">✅</div>
              <h3 className="font-bold text-green-900 mb-3 text-xl checkin-title">Already Checked In</h3>
              {eventData.checkedInAt && (
                <p className="text-sm text-green-700 font-medium checkin-text">
                  Check-in time: {new Date(eventData.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/events')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium checkin-text"
            >
              ← Back to Events
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}