'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

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

  const handleCheckIn = async () => {
    if (status !== 'authenticated') {
      // Redirect to sign in with return URL
      const currentUrl = window.location.href;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
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
        method: 'POST'
      });

      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInCode,
          attendeeId
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying event information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !eventData.eventTitle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Unable to Verify Event</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center">
          {/* Event Information */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Event Check-in</h1>
            <div className="bg-blue-50 p-4 rounded-lg text-left border border-blue-200">
              <h2 className="font-bold text-blue-900 mb-3 text-lg">{eventData.eventTitle}</h2>
              {eventData.eventDate && (
                <p className="text-sm text-blue-700 mb-2 flex items-center">
                  <span className="mr-2">📅</span>
                  {new Date(eventData.eventDate).toLocaleDateString()}
                </p>
              )}
              {eventData.eventLocation && (
                <p className="text-sm text-blue-700 flex items-center">
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
                <p className="text-sm text-green-700">
                  ✅ Signed in as: {session.user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700">
                  🔐 You need to sign in to check in
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800">{message}</p>
              </div>
            </div>
          )}

          {error && eventData.eventTitle && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Check-in Button */}
          {!eventData.alreadyCheckedIn && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              data-action="check-in"
              data-event-slug={eventId}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg shadow-lg"
            >
              {checkingIn ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing Check-in...
                </span>
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
              <h3 className="font-bold text-green-900 mb-3 text-xl">Already Checked In</h3>
              {eventData.checkedInAt && (
                <p className="text-sm text-green-700 font-medium">
                  Check-in time: {new Date(eventData.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/events')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}