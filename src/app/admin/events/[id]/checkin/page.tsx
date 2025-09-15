'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { QrCodeIcon, CheckIcon, XMarkIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

interface Attendee {
  id: string;
  attendee: {
    name?: string;
    umichEmail: string;
    major?: string;
    gradeLevel?: string;
    phone?: string;
  };
  status: 'confirmed' | 'waitlisted' | 'attended' | 'cancelled';
  checkInCode?: string;
  registeredAt: number;
  confirmedAt?: number;
  attendedAt?: number;
  checkInPhoto?: string;
}

interface Event {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  capacity?: number;
  slug: string;
}

export default function EventCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'attended'>('all');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  // Helper function to generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email?.endsWith('@umich.edu')) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Load event and attendees data
  useEffect(() => {
    if (!eventId) {
      console.error('No eventId provided');
      return;
    }
    console.log('Loading data for eventId:', eventId);
    loadEventData();
    loadAttendees();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Loaded event data:', data);
        setEvent(data);
      } else {
        console.error('Failed to load event data:', res.status, res.statusText);
        setMessage('Failed to load event data');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      setMessage('Error loading event data');
      setMessageType('error');
    }
  };

  const loadAttendees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendance`);
      if (res.ok) {
        const data = await res.json();
        // Include all attendees: confirmed, waitlisted, and any that are already checked in
        const allAttendees = [
          ...(data.confirmed || []),
          ...(data.waitlisted || []),
          // Add any attendees that might be in 'attended' status
          ...(data.attendees || []).filter((a: any) => a.status === 'attended')
        ];
        
        // Remove duplicates based on ID
        const uniqueAttendees = allAttendees.filter((attendee, index, self) => 
          index === self.findIndex(a => a.id === attendee.id)
        );
        
        setAttendees(uniqueAttendees);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkInAttendee = async (attendeeId: string) => {
    setCheckingIn(attendeeId);
    setMessage('');
    
    try {
      const res = await fetch(`/api/admin/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId })
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage('Successfully checked in attendee!');
        setMessageType('success');
        // Update local state
        setAttendees(prev => prev.map(attendee => 
          attendee.id === attendeeId 
            ? { ...attendee, status: 'attended' as const, attendedAt: Date.now() }
            : attendee
        ));
      } else {
        setMessage(result.error || 'Failed to check in attendee');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error checking in attendee');
      setMessageType('error');
    } finally {
      setCheckingIn(null);
    }
  };

  const generateEventQRCode = async () => {
    console.log('Generate QR code clicked, event:', event);
    
    // Check if event data is loaded
    if (!event) {
      const errorMsg = 'Event data not loaded yet. Please wait and try again.';
      console.error(errorMsg);
      setMessage(errorMsg);
      setMessageType('error');
      return;
    }
    
    try {
      // Use event ID as fallback if title is missing
      const eventTitle = event.title || `Event ${event.id}`;
      const eventSlug = event.slug || generateSlug(eventTitle);
      
      console.log('Event title:', eventTitle);
      console.log('Event slug:', eventSlug);
      
      if (!eventSlug) {
        const errorMsg = 'Unable to generate QR code: Could not create event URL';
        console.error(errorMsg);
        setMessage(errorMsg);
        setMessageType('error');
        return;
      }

      // Create a simple URL that goes to the event check-in page
      const baseUrl = window.location.origin;
      const checkInUrl = `${baseUrl}/events/${eventSlug}/checkin`;
      
      console.log('Check-in URL:', checkInUrl);

      const qrCodeUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('QR code generated successfully');
      setQrCodeData(qrCodeUrl);
      setSelectedAttendee(null); // No specific attendee for event QR
      setShowQRModal(true);
      
      // Show success message
      setMessage('QR code generated successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error generating event QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Failed to generate QR code: ${errorMessage}`);
      setMessageType('error');
    }
  };

  const undoCheckIn = async (attendeeId: string) => {
    setCheckingIn(attendeeId);
    setMessage('');
    
    try {
      const res = await fetch(`/api/admin/events/${eventId}/checkin`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId })
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage('Check-in status reversed');
        setMessageType('success');
        // Update local state
        setAttendees(prev => prev.map(attendee => 
          attendee.id === attendeeId 
            ? { ...attendee, status: 'confirmed' as const, attendedAt: undefined }
            : attendee
        ));
      } else {
        setMessage(result.error || 'Failed to reverse check-in');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error reversing check-in');
      setMessageType('error');
    } finally {
      setCheckingIn(null);
    }
  };

  // Filter attendees based on search and status
  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = searchTerm === '' || 
      attendee.attendee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.attendee.umichEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.checkInCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'confirmed' && attendee.status === 'confirmed') ||
      (filterStatus === 'attended' && attendee.status === 'attended');
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: attendees.length,
    checkedIn: attendees.filter(a => a.status === 'attended').length,
    remaining: attendees.filter(a => a.status === 'confirmed').length
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Check-In</h1>
              {event && (
                <div className="mt-2 space-y-1">
                  <h2 className="text-lg text-gray-700">{event.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📅 {new Date(event.eventDate).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</span>
                    <span>📍 {event.location}</span>
                    {event.capacity && <span>👥 Capacity: {event.capacity}</span>}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/admin/events')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Events
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Registered</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
              <div className="text-sm text-green-600">Checked In</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.remaining}</div>
              <div className="text-sm text-yellow-600">Awaiting Check-In</div>
            </div>
          </div>
          
          {/* Event QR Code Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={generateEventQRCode}
              disabled={!event || loading}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                !event || loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <QrCodeIcon className="w-5 h-5" />
              {loading ? 'Loading Event Data...' : 'Generate Event Check-in QR Code'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Attendees
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or check-in code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'confirmed' | 'attended')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent"
              >
                <option value="all">All Attendees</option>
                <option value="confirmed">Awaiting Check-In</option>
                <option value="attended">Checked In</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAttendees.length} of {attendees.length} attendees
          </div>
        </div>

        {/* Attendees List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Attendees</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c] mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading attendees...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendees found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-In Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendees.map((attendee) => (
                    <tr key={attendee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendee.attendee.name || 'No name provided'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attendee.attendee.umichEmail}
                            </div>
                            {attendee.attendee.major && (
                              <div className="text-xs text-gray-400">
                                {attendee.attendee.major}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QrCodeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-mono text-gray-900">
                            {attendee.checkInCode || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attendee.status === 'attended'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attendee.status === 'attended' ? '✓ Checked In' : '○ Awaiting Check-In'}
                          </span>
                          {attendee.attendedAt && (
                            <span className="text-xs text-gray-500">
                              {formatDateTime(attendee.attendedAt)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendee.checkInPhoto ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={attendee.checkInPhoto} 
                              alt="Check-in photo" 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                            <button
                              onClick={() => {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`<img src="${attendee.checkInPhoto}" style="max-width: 100%; height: auto;" />`);
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              View Full
                            </button>
                          </div>
                        ) : attendee.status === 'attended' ? (
                          <span className="text-xs text-gray-400">No photo</span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {attendee.status === 'attended' ? (
                          <button
                            onClick={() => undoCheckIn(attendee.id)}
                            disabled={checkingIn === attendee.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            {checkingIn === attendee.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            ) : (
                              <XMarkIcon className="h-3 w-3" />
                            )}
                            Undo Check-In
                          </button>
                        ) : (
                          <button
                            onClick={() => checkInAttendee(attendee.id)}
                            disabled={checkingIn === attendee.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors"
                          >
                            {checkingIn === attendee.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                            ) : (
                              <CheckIcon className="h-3 w-3" />
                            )}
                            Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Check-In QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 text-center">
              <div className="mb-4">
                {selectedAttendee ? (
                  <>
                    <h4 className="font-medium text-gray-900">
                      {selectedAttendee.attendee.name || 'No name provided'}
                    </h4>
                    <p className="text-sm text-gray-500">{selectedAttendee.attendee.umichEmail}</p>
                    <p className="text-xs text-gray-400 mt-1">Check-in Code: {selectedAttendee.checkInCode}</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-gray-900">Event Check-in QR Code</h4>
                    <p className="text-sm text-gray-500">{event?.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Scan to check in to this event</p>
                  </>
                )}
              </div>
              
              {qrCodeData && (
                <div className="mb-4">
                  <img 
                    src={qrCodeData} 
                    alt="QR Code for check-in" 
                    className="mx-auto border border-gray-200 rounded"
                  />
                </div>
              )}
              
              <div className="text-xs text-gray-500 mb-4">
                {selectedAttendee 
                  ? 'This QR code is specific to this attendee. When scanned, they will be prompted to sign in and can check themselves in.'
                  : 'This QR code can be scanned by any registered attendee. They will be prompted to sign in with their UMich account and will be automatically checked in if they are confirmed for this event.'
                }
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Download QR code
                    const link = document.createElement('a');
                    link.download = selectedAttendee 
                      ? `checkin-${selectedAttendee.checkInCode}.png`
                      : `event-checkin-${event?.slug || 'event'}.png`;
                    link.href = qrCodeData;
                    link.click();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Download QR Code
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}