'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  MapPinIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { getTrackLabel } from '@/lib/tracks';
import type { RecruitmentSlot, SlotBooking, PortalDashboard, SlotKind } from '@/types/recruitment';

const SLOT_KIND_INFO: Record<SlotKind, { label: string; color: string; description: string }> = {
  coffee_chat: { 
    label: 'Coffee Chat', 
    color: 'bg-amber-100 text-amber-800',
    description: 'A casual conversation to learn more about ABG'
  },
  interview_round1: { 
    label: 'Interview Round 1', 
    color: 'bg-blue-100 text-blue-800',
    description: 'First round interview'
  },
  interview_round2: { 
    label: 'Interview Round 2', 
    color: 'bg-purple-100 text-purple-800',
    description: 'Final round interview'
  },
};

// Generate Google Calendar link to add event manually (fallback if no auto-created event)
const generateGCalLink = (booking: SlotBooking): string => {
  if (!booking.slotDetails) return '#';
  
  const { startTime, durationMinutes, hostName, hostEmail, location, meetingUrl } = booking.slotDetails;
  const kindInfo = SLOT_KIND_INFO[booking.slotKind];
  
  const start = new Date(startTime);
  const end = new Date(start.getTime() + (durationMinutes || 30) * 60000);
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGCalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const title = encodeURIComponent(`ABG ${kindInfo?.label || booking.slotKind} with ${hostName}`);
  const details = encodeURIComponent(
    `${kindInfo?.label || booking.slotKind} with ${hostName}\n\n` +
    `Host: ${hostName}${hostEmail ? ` (${hostEmail})` : ''}\n` +
    (meetingUrl ? `\nJoin: ${meetingUrl}` : '')
  );
  const locationStr = encodeURIComponent(location || meetingUrl || 'TBD');
  
  // Add both applicant and host as guests
  const guests: string[] = [];
  if (booking.applicantEmail) guests.push(booking.applicantEmail);
  if (hostEmail) guests.push(hostEmail);
  const guestsParam = guests.length > 0 ? `&add=${encodeURIComponent(guests.join(','))}` : '';
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${details}&location=${locationStr}${guestsParam}`;
};

interface SlotWithDetails extends RecruitmentSlot {
  isBooked?: boolean;
}

export default function PortalSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotWithDetails[]>([]);
  const [myBookings, setMyBookings] = useState<SlotBooking[]>([]);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  
  // Coffee chat filters
  const [nameFilter, setNameFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

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
      setAvailableSlots(data.availableSlots || []);
      setMyBookings(data.myBookings || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slotId: string) => {
    if (!dashboard?.activeCycle) return;
    
    try {
      setBookingLoading(slotId);
      const res = await fetch('/api/portal/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: dashboard.activeCycle._id,
          slotId,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to book');
      }
      
      const result = await res.json();
      
      // Show success message with calendar info
      if (result.calendarEvent?.created) {
        toast.success('Slot booked! Calendar invite sent to you and your host.');
      } else {
        toast.success('Slot booked successfully!');
      }
      
      loadData(); // Refresh to get updated data
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to book');
    } finally {
      setBookingLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this booking? This will also cancel the calendar invite.')) return;
    
    try {
      setBookingLoading(bookingId);
      const res = await fetch(`/api/portal/booking?bookingId=${bookingId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel');
      }
      
      toast.success('Booking cancelled');
      loadData();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel');
    } finally {
      setBookingLoading(null);
    }
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isSlotPast = (dateStr: string): boolean => {
    return new Date(dateStr) < new Date();
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
        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Current Recruitment Cycles</h2>
        <p className="text-gray-600">There are no current cycles to apply to. Scheduling will be available when recruitment opens.</p>
      </div>
    );
  }

  // Check if user is at a stage where they can book
  const application = dashboard.application;
  const userTrack = application?.track;
  
  // Coffee chats are open to anyone, interviews require stage progression
  const canBookCoffeeChats = true;  // Anyone can book coffee chats
  
  // Determine which interview round the user can book based on their stage
  const canBookRound1 = application?.stage === 'interview_round1';
  const canBookRound2 = application?.stage === 'interview_round2';

  return (
    <div className="space-y-8">
      <div style={{ color: '#111827' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Schedule</h1>
        <p className="text-gray-600">
          Book time slots for coffee chats and interviews
        </p>
      </div>

      {/* My Bookings */}
      {myBookings.filter(b => b.status !== 'cancelled').length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            Your Scheduled Meetings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myBookings.filter(b => b.status !== 'cancelled').map((booking) => {
              const kindInfo = SLOT_KIND_INFO[booking.slotKind];
              const slotDetails = booking.slotDetails;
              const isPast = slotDetails ? isSlotPast(slotDetails.startTime) : false;
              
              // Determine badge style based on slot kind
              const getBadgeStyle = (): React.CSSProperties => {
                if (booking.slotKind === 'coffee_chat') return { backgroundColor: '#fef3c7', color: '#92400e' };
                if (booking.slotKind === 'interview_round1') return { backgroundColor: '#dbeafe', color: '#1e40af' };
                if (booking.slotKind === 'interview_round2') return { backgroundColor: '#f3e8ff', color: '#6b21a8' };
                return { backgroundColor: '#f3f4f6', color: '#374151' };
              };
              
              const getBadgeLabel = () => {
                if (booking.slotKind === 'coffee_chat') return 'Coffee Chat';
                if (booking.slotKind === 'interview_round1') return 'Round 1 Interview';
                if (booking.slotKind === 'interview_round2') return 'Round 2 Interview';
                return booking.slotKind;
              };
              
              return (
                <div
                  key={booking._id}
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 ${isPast ? 'opacity-60' : ''}`}
                >
                  {/* Header with type badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={getBadgeStyle()}
                    >
                      {getBadgeLabel()}
                    </span>
                    <span 
                      className="px-1.5 py-0.5 text-xs rounded"
                      style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                    >
                      ✓ Confirmed
                    </span>
                  </div>
                  
                  {/* Date & Time */}
                  <p className="flex items-center gap-1.5 text-sm font-medium mb-1" style={{ color: '#111827' }}>
                    <CalendarDaysIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {slotDetails 
                      ? formatDateTime(slotDetails.startTime)
                      : formatDateTime(booking.bookedAt)
                    }
                  </p>
                  
                  {/* Host */}
                  {slotDetails?.hostName && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                      <UserIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="truncate">{slotDetails.hostName}</span>
                    </p>
                  )}
                  
                  {/* Location or Virtual */}
                  {slotDetails?.location && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                      <MapPinIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="truncate">{slotDetails.location}</span>
                    </p>
                  )}
                  {slotDetails?.meetingUrl && !slotDetails?.location && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                      <VideoCameraIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <a href={slotDetails.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        Virtual Meeting
                      </a>
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  {booking.status === 'confirmed' && !isPast && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      <a
                        href={generateGCalLink(booking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        Add to Calendar
                      </a>
                      <button
                        onClick={() => handleCancelBooking(booking._id!)}
                        disabled={bookingLoading === booking._id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        {bookingLoading === booking._id ? '...' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coffee Chats Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#111827' }}>☕ Coffee Chats</h2>
        <p className="text-sm text-gray-600 mb-4">
          Meet with ABG members for a casual conversation to learn more about our organization.
        </p>
        
        {(() => {
          const allCoffeeSlots = availableSlots.filter(s => s.kind === 'coffee_chat');
          
          // Get unique values for filter dropdowns
          const uniqueDays = [...new Set(allCoffeeSlots.map(s => 
            new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
          ))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          const uniqueHosts = [...new Set(allCoffeeSlots.map(s => s.hostName))].sort();
          const uniqueLocations = [...new Set(allCoffeeSlots.map(s => s.location).filter(Boolean))].sort();
          
          // Apply filters
          const coffeeSlots = allCoffeeSlots.filter(slot => {
            const matchesName = !nameFilter || slot.hostName === nameFilter;
            const matchesDay = !dayFilter || new Date(slot.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' }) === dayFilter;
            const matchesLocation = !locationFilter || slot.location === locationFilter;
            return matchesName && matchesDay && matchesLocation;
          });
          const coffeeSlotsByDate = coffeeSlots.reduce((acc, slot) => {
            const date = new Date(slot.startTime).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(slot);
            return acc;
          }, {} as Record<string, SlotWithDetails[]>);
          
          // Show filter UI if there are any coffee slots
          const filterUI = allCoffeeSlots.length > 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Host Name</label>
                  <select
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="">All Hosts</option>
                    {uniqueHosts.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                  <select
                    value={dayFilter}
                    onChange={(e) => setDayFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="">All Days</option>
                    {uniqueDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(nameFilter || dayFilter || locationFilter) && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Showing {coffeeSlots.length} of {allCoffeeSlots.length} slots
                  </span>
                  <button
                    onClick={() => { setNameFilter(''); setDayFilter(''); setLocationFilter(''); }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : null;
          
          if (allCoffeeSlots.length === 0) {
            return (
              <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center text-gray-500">
                No coffee chat slots available at this time. Check back later!
              </div>
            );
          }
          
          if (coffeeSlots.length === 0) {
            return (
              <>
                {filterUI}
                <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center text-gray-500">
                  No slots match your filters. Try adjusting your search criteria.
                </div>
              </>
            );
          }
          
          return (
            <div className="space-y-6">
              {filterUI}
              {Object.entries(coffeeSlotsByDate)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {slots
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((slot) => {
                          const isAvailable = slot.bookedCount < slot.maxBookings;
                          const isPast = isSlotPast(slot.startTime);
                          const isLoading = bookingLoading === slot._id;
                          const alreadyBookedKind = myBookings.some(
                            b => b.slotKind === 'coffee_chat' && b.status === 'confirmed'
                          );
                          
                          return (
                            <div
                              key={slot._id}
                              className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${
                                !isAvailable || isPast || alreadyBookedKind ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="space-y-2 mb-4">
                                <p className="flex items-center gap-2 text-sm text-gray-900">
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                  {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                  <span className="text-gray-400">• {slot.durationMinutes} min</span>
                                </p>
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                  <UserIcon className="w-4 h-4 text-gray-400" />
                                  {slot.hostName}
                                </p>
                                {slot.location && (
                                  <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                                    {slot.location}
                                  </p>
                                )}
                                {slot.meetingUrl && (
                                  <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <VideoCameraIcon className="w-4 h-4 text-gray-400" />
                                    Virtual
                                  </p>
                                )}
                              </div>

                              {alreadyBookedKind ? (
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Already booked
                                </div>
                              ) : isPast ? (
                                <div className="text-sm text-gray-400">Past</div>
                              ) : !isAvailable ? (
                                <div className="text-sm text-gray-400">No spots available</div>
                              ) : (
                                <button
                                  onClick={() => handleBook(slot._id!)}
                                  disabled={isLoading}
                                  className="w-full py-2 bg-blue-600 !text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isLoading ? 'Booking...' : 'Book Coffee Chat'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          );
        })()}
      </div>

      {/* Interviews Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>🎯 Interviews</h2>
        
        {/* Show different content based on application stage */}
        {!application || !['interview_round1', 'interview_round2'].includes(application.stage) ? (
          // User hasn't reached interview stage yet
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Interview slots not available yet</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Interview scheduling will become available once you advance to the interview stage. 
              Keep an eye on your application status!
            </p>
            {application && (
              <p className="text-xs text-gray-500 mt-3">
                Current stage: <span className="font-medium">{application.stage.replace(/_/g, ' ')}</span>
              </p>
            )}
          </div>
        ) : (
          // User is at interview stage - show available interview slots
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-4">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {canBookRound1 ? 'Interview Round 1' : 'Interview Round 2'} - {getTrackLabel(userTrack || 'business')} Track
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  You've advanced to {canBookRound1 ? 'Round 1' : 'Round 2'} interviews! 
                  Book a slot below to schedule your interview.
                </p>
              </div>
            </div>
            
            {(() => {
              const interviewSlots = availableSlots.filter(s => 
                (canBookRound1 && s.kind === 'interview_round1') || 
                (canBookRound2 && s.kind === 'interview_round2')
              );
              const interviewSlotsByDate = interviewSlots.reduce((acc, slot) => {
                const date = new Date(slot.startTime).toDateString();
                if (!acc[date]) acc[date] = [];
                acc[date].push(slot);
                return acc;
              }, {} as Record<string, SlotWithDetails[]>);
              
              if (interviewSlots.length === 0) {
                return (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center text-gray-500">
                    No interview slots available at this time. Check back later or contact the recruitment team.
                  </div>
                );
              }
              
              return (
                <div className="space-y-6">
                  {Object.entries(interviewSlotsByDate)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, slots]) => (
                      <div key={date}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {slots
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map((slot) => {
                              const kindInfo = SLOT_KIND_INFO[slot.kind];
                              const isAvailable = slot.bookedCount < slot.maxBookings;
                              const isPast = isSlotPast(slot.startTime);
                              const isLoading = bookingLoading === slot._id;
                              const alreadyBookedKind = myBookings.some(
                                b => b.slotKind === slot.kind && b.status === 'confirmed'
                              );
                              
                              return (
                                <div
                                  key={slot._id}
                                  className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${
                                    !isAvailable || isPast || alreadyBookedKind ? 'opacity-60' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${kindInfo?.color || 'bg-gray-100'}`}>
                                      {kindInfo?.label || slot.kind}
                                    </span>
                                    {slot.forTrack && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                        {getTrackLabel(slot.forTrack)}
                                      </span>
                                    )}
                                    {!isAvailable && (
                                      <span className="text-xs text-gray-400">Full</span>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2 mb-4">
                                    <p className="flex items-center gap-2 text-sm text-gray-900">
                                      <ClockIcon className="w-4 h-4 text-gray-400" />
                                      {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                      <span className="text-gray-400">• {slot.durationMinutes} min</span>
                                    </p>
                                    <p className="flex items-center gap-2 text-sm text-gray-600">
                                      <UserIcon className="w-4 h-4 text-gray-400" />
                                      {slot.hostName}
                                    </p>
                                    {slot.location && (
                                      <p className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                                        {slot.location}
                                      </p>
                                    )}
                                    {slot.meetingUrl && (
                                      <p className="flex items-center gap-2 text-sm text-gray-600">
                                        <VideoCameraIcon className="w-4 h-4 text-gray-400" />
                                        Virtual
                                      </p>
                                    )}
                                  </div>

                                  {alreadyBookedKind ? (
                                    <div className="flex items-center gap-1 text-sm text-green-600">
                                      <CheckCircleIcon className="w-4 h-4" />
                                      Already booked
                                    </div>
                                  ) : isPast ? (
                                    <div className="text-sm text-gray-400">Past</div>
                                  ) : !isAvailable ? (
                                    <div className="text-sm text-gray-400">No spots available</div>
                                  ) : (
                                    <button
                                      onClick={() => handleBook(slot._id!)}
                                      disabled={isLoading}
                                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {isLoading ? 'Booking...' : 'Book Interview'}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
