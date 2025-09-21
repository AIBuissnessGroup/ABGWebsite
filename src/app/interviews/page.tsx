'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ClockIcon, MapPinIcon, CheckIcon, CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type InterviewSignup = {
  id: string;
  userEmail: string;
  userName: string | null;
  uniqname: string;
  createdAt: string;
};

type InterviewSlot = {
  id: string;
  room: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'available' | 'booked';
  bookedByUserId?: string;
  signup?: InterviewSignup;
  isBookedByCurrentUser?: boolean;
};

export default function InterviewsPage() {
  const { data: session, status } = useSession();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userBooking, setUserBooking] = useState<InterviewSlot | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Filter slots based on selected filters
  const filteredSlots = slots.filter(slot => {
    const roomMatch = roomFilter === 'all' || slot.room === roomFilter;
    
    let timeMatch = true;
    if (timeFilter !== 'all') {
      const slotHour = new Date(slot.startTime).getHours();
      switch (timeFilter) {
        case '6pm':
          timeMatch = slotHour === 18;
          break;
        case '7pm':
          timeMatch = slotHour === 19;
          break;
        case '8pm':
          timeMatch = slotHour === 20;
          break;
        case '9pm':
          timeMatch = slotHour === 21;
          break;
        default:
          timeMatch = true;
      }
    }
    
    return roomMatch && timeMatch;
  });

  // Group filtered slots by room
  const slotsByRoom = filteredSlots.reduce((acc, slot) => {
    if (!acc[slot.room]) {
      acc[slot.room] = [];
    }
    acc[slot.room].push(slot);
    return acc;
  }, {} as Record<string, InterviewSlot[]>);

  // Sort rooms for consistent display
  const sortedRooms = Object.keys(slotsByRoom).sort();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      signIn();
      return;
    }

    if (!session.user?.email?.endsWith('@umich.edu')) {
      setMessage('University of Michigan login required');
      setMessageType('error');
      setLoading(false);
      return;
    }

    loadSlots();
  }, [session, status]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      // Get next Wednesday's date
      const nextWednesday = getNextWednesday();
      const response = await fetch(`/api/interviews/slots?date=${nextWednesday}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load slots');
      }
      
      setSlots(data);
      
      // Find user's current booking
      const currentUserBooking = data.find((slot: InterviewSlot) => slot.isBookedByCurrentUser);
      setUserBooking(currentUserBooking || null);
      
    } catch (error) {
      console.error('Error loading slots:', error);
      setMessage('Failed to load interview slots');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getNextWednesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 3 = Wednesday
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    return nextWednesday.toISOString().split('T')[0];
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Detroit'
    });
  };

  const bookSlot = async (slotId: string) => {
    if (userBooking) {
      setMessage('You already have an interview booked. Please cancel it first if you want to book a different time.');
      setMessageType('error');
      return;
    }

    setActionLoading(slotId);
    try {
      const response = await fetch(`/api/interviews/slots/${slotId}/book`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          // Special handling for whitelist error
          setMessage('You are not approved for interview signups. Please contact ABGRecruitment@umich.edu if you believe this is an error.');
        } else {
          setMessage(data.error || 'Failed to book slot');
        }
        setMessageType('error');
        return;
      }
      
      setMessage('Successfully booked interview slot! A Google Calendar event link has been prepared for you.');
      setMessageType('success');
      await loadSlots(); // Refresh slots
      
      // Automatically open Google Calendar to add the event
      const bookedSlot = slots.find(slot => slot.id === slotId);
      if (bookedSlot) {
        // Small delay to let the user see the success message first
        setTimeout(() => {
          addToGoogleCalendar(bookedSlot);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error booking slot:', error);
      setMessage('Failed to book slot. Please try again.');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBooking = async (slotId: string) => {
    setActionLoading(slotId);
    try {
      const response = await fetch(`/api/interviews/slots/${slotId}/cancel`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      setMessage('Successfully cancelled interview booking');
      setMessageType('success');
      await loadSlots(); // Refresh slots
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to cancel booking');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const canCancelBooking = (slot: InterviewSlot) => {
    if (!slot.isBookedByCurrentUser) return false;
    
    const slotStartTime = new Date(slot.startTime);
    const now = new Date();
    const hoursUntilStart = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilStart > 5;
  };

  const addToGoogleCalendar = (slot: InterviewSlot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    const eventDetails = {
      text: 'AI Business Group Interview',
      dates: `${formatDateForGoogle(startTime)}/${formatDateForGoogle(endTime)}`,
      location: `Room ${slot.room}`,
      details: 'Attire: Suit and tie business professional. Bring two copies of your resume.'
    };
    
    const params = new URLSearchParams(eventDetails);
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&${params}`, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session || !session.user?.email?.endsWith('@umich.edu')) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">University of Michigan Login Required</h1>
          <p className="mb-6">Please sign in with your @umich.edu email to access interviews.</p>
          <button 
            onClick={() => signIn()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Sign In with UMich
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00274c] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">R1 Behavioral Interviews | Wednesday 9/24: 6-10pm</h1>
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-yellow-100 text-lg">
              <strong>Attire:</strong> Suit and tie business professional. Please bring two copies of your resume.
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            messageType === 'success' 
              ? 'bg-green-500/20 border border-green-400/30 text-green-100' 
              : 'bg-red-500/20 border border-red-400/30 text-red-100'
          }`}>
            {message}
          </div>
        )}

        {/* Filter Controls */}
        <div className="mb-8 bg-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Filter Interview Slots</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Room Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Room</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full bg-[#00274c] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Rooms</option>
                <option value="R2248">R2248</option>
                <option value="R1226">R1226</option>
                <option value="R1228">R1228</option>
                <option value="R1236">R1236</option>
                <option value="R1238">R1238</option>
                <option value="R1216">R1216</option>
              </select>
            </div>
            
            {/* Time Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Time</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full bg-[#00274c] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Times</option>
                <option value="6pm">6:00 PM Hour</option>
                <option value="7pm">7:00 PM Hour</option>
                <option value="8pm">8:00 PM Hour</option>
                <option value="9pm">9:00 PM Hour</option>
              </select>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          <div className="mt-4 text-sm text-gray-300">
            Showing {filteredSlots.length} of {slots.length} slots
            {roomFilter !== 'all' && ` in Room ${roomFilter}`}
            {timeFilter !== 'all' && ` at ${timeFilter.replace('pm', ':00 PM')}`}
          </div>
        </div>
        {userBooking && (
          <div className="mb-8 bg-blue-500/20 border border-blue-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-blue-100 mb-2">Your Interview Booking</h3>
                <div className="text-blue-200">
                  <p className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5" />
                    Room {userBooking.room}
                  </p>
                  <p className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    {formatTime(userBooking.startTime)} - {formatTime(userBooking.endTime)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => addToGoogleCalendar(userBooking)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <CalendarDaysIcon className="w-5 h-5 inline mr-2" />
                  Add to Calendar
                </button>
                {canCancelBooking(userBooking) ? (
                  <button
                    onClick={() => cancelBooking(userBooking.id)}
                    disabled={actionLoading === userBooking.id}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === userBooking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                ) : (
                  <div className="text-yellow-200 text-sm flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    Cannot cancel within 5 hours
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Slots by Room */}
        {slots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-300">No interview slots available. Please check back later.</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-300">No slots match your current filters.</p>
            <button
              onClick={() => {
                setRoomFilter('all');
                setTimeFilter('all');
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {sortedRooms.map((room) => (
              <div key={room} className="bg-white/10 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-center">Room {room}</h2>
                <div className="space-y-3">
                  {slotsByRoom[room]
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((slot) => (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        slot.status === 'booked'
                          ? 'border-red-400/30 bg-red-500/10'
                          : 'border-green-400/30 bg-green-500/10 hover:bg-green-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ClockIcon className="w-5 h-5" />
                          <span className="font-medium">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                        </div>
                        
                        {slot.status === 'available' && !userBooking ? (
                          <button
                            onClick={() => bookSlot(slot.id)}
                            disabled={actionLoading === slot.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === slot.id ? 'Booking...' : 'Book'}
                          </button>
                        ) : slot.status === 'available' && userBooking ? (
                          <div className="text-gray-400 text-sm">
                            Available
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-300">
                            <CheckIcon className="w-5 h-5" />
                            Booked
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}