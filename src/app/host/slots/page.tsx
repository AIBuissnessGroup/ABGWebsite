'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  MapPinIcon,
  VideoCameraIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  UserGroupIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolid,
  HandThumbDownIcon as HandThumbDownSolid,
  MinusIcon as MinusSolid,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import type { RecruitmentSlot, SlotBooking, SlotKind, ReferralSignal } from '@/types/recruitment';

const SLOT_KIND_INFO: Record<SlotKind, { label: string; color: string; bgColor: string }> = {
  coffee_chat: { 
    label: 'Coffee Chat', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200'
  },
  interview_round1: { 
    label: 'Interview Round 1', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  interview_round2: { 
    label: 'Interview Round 2', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
};

interface SlotWithBookings extends RecruitmentSlot {
  bookings: SlotBooking[];
  availableSpots: number;
}

interface HostSlotsResponse {
  slots: SlotWithBookings[];
  isHost: boolean;
  hostEmail?: string;
  message?: string;
}

interface ReferralMap {
  [bookingId: string]: { signal: ReferralSignal; notes?: string };
}

export default function HostSlotsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<HostSlotsResponse | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [filterKind, setFilterKind] = useState<SlotKind | ''>('');
  const [referrals, setReferrals] = useState<ReferralMap>({});
  const [savingReferral, setSavingReferral] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadSlots();
      loadReferrals();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/host/slots');
      if (!res.ok) throw new Error('Failed to load slots');
      const result: HostSlotsResponse = await res.json();
      setData(result);
      
      // Auto-expand all slots with bookings
      const slotsWithBookings = result.slots
        .filter(s => s.bookings.length > 0)
        .map(s => s._id!);
      setExpandedSlots(new Set(slotsWithBookings));
    } catch (error) {
      console.error('Error loading host slots:', error);
      toast.error('Failed to load your slots');
    } finally {
      setLoading(false);
    }
  };

  const loadReferrals = async () => {
    try {
      const res = await fetch('/api/host/slots/referral');
      if (!res.ok) throw new Error('Failed to load referrals');
      const result = await res.json();
      setReferrals(result.referrals || {});
    } catch (error) {
      console.error('Error loading referrals:', error);
      // Don't show error toast - referrals are optional
    }
  };

  const saveReferral = async (bookingId: string, signal: ReferralSignal) => {
    setSavingReferral(bookingId);
    try {
      const res = await fetch('/api/host/slots/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, signal }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save referral');
      }
      
      // Update local state
      setReferrals(prev => ({
        ...prev,
        [bookingId]: { signal },
      }));
      
      const signalLabels = {
        referral: 'Positive referral',
        neutral: 'Neutral',
        deferral: 'Negative referral',
      };
      toast.success(`${signalLabels[signal]} saved`);
    } catch (error: any) {
      console.error('Error saving referral:', error);
      toast.error(error.message || 'Failed to save referral');
    } finally {
      setSavingReferral(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSlots(), loadReferrals()]);
    setRefreshing(false);
    toast.success('Refreshed');
  };

  const toggleSlot = (slotId: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // Filter slots
  const filteredSlots = data?.slots?.filter(slot => {
    if (filterKind && slot.kind !== filterKind) return false;
    return true;
  }) || [];

  // Group by upcoming vs past
  const upcomingSlots = filteredSlots.filter(s => !isPast(s.startTime));
  const pastSlots = filteredSlots.filter(s => isPast(s.startTime));

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your slots...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in with your University of Michigan email to view your hosted slots.
          </p>
          <Link
            href="/auth/signin?callbackUrl=/host/slots"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!data?.isHost || data.slots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">No Hosted Slots</h1>
            <p className="text-gray-600 mb-2">
              You don&apos;t have any slots assigned to you as a host.
            </p>
            <p className="text-sm text-gray-500">
              Signed in as: {session?.user?.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalBookings = data.slots.reduce((sum, s) => sum + s.bookings.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Hosted Slots</h1>
              <p className="text-gray-600 mt-1">
                View who has signed up for your slots
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Signed in as: {data.hostEmail}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.slots.length}</div>
              <div className="text-sm text-blue-600">Total Slots</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totalBookings}</div>
              <div className="text-sm text-green-600">Total Signups</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{upcomingSlots.length}</div>
              <div className="text-sm text-amber-600">Upcoming</div>
            </div>
          </div>

          {/* Filter */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by type:</span>
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value as SlotKind | '')}
              className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="coffee_chat">Coffee Chats</option>
              <option value="interview_round1">Interview Round 1</option>
              <option value="interview_round2">Interview Round 2</option>
            </select>
          </div>
        </div>

        {/* Upcoming Slots */}
        {upcomingSlots.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Slots</h2>
            {upcomingSlots.map((slot) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                isExpanded={expandedSlots.has(slot._id!)}
                onToggle={() => toggleSlot(slot._id!)}
                formatDate={formatDate}
                formatTime={formatTime}
                referrals={referrals}
                onSaveReferral={saveReferral}
                savingReferral={savingReferral}
              />
            ))}
          </div>
        )}

        {/* Past Slots */}
        {pastSlots.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-500">Past Slots</h2>
            {pastSlots.map((slot) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                isExpanded={expandedSlots.has(slot._id!)}
                onToggle={() => toggleSlot(slot._id!)}
                formatDate={formatDate}
                formatTime={formatTime}
                isPast
                referrals={referrals}
                onSaveReferral={saveReferral}
                savingReferral={savingReferral}
              />
            ))}
          </div>
        )}

        {filteredSlots.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No slots match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SlotCardProps {
  slot: SlotWithBookings;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  isPast?: boolean;
  referrals: ReferralMap;
  onSaveReferral: (bookingId: string, signal: ReferralSignal) => Promise<void>;
  savingReferral: string | null;
}

function SlotCard({ 
  slot, 
  isExpanded, 
  onToggle, 
  formatDate, 
  formatTime, 
  isPast,
  referrals,
  onSaveReferral,
  savingReferral,
}: SlotCardProps) {
  const kindInfo = SLOT_KIND_INFO[slot.kind];
  const isCoffeeChat = slot.kind === 'coffee_chat';
  
  return (
    <div className={`bg-white rounded-xl shadow overflow-hidden ${isPast ? 'opacity-60' : ''}`}>
      {/* Slot Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${kindInfo.bgColor} ${kindInfo.color} border`}>
            {kindInfo.label}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 text-gray-900">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{formatDate(slot.startTime)}</span>
              <span className="text-gray-400">•</span>
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span>{formatTime(slot.startTime)}</span>
              <span className="text-gray-500 text-sm">({slot.durationMinutes} min)</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              {slot.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {slot.location}
                </span>
              )}
              {slot.meetingUrl && (
                <span className="flex items-center gap-1">
                  <VideoCameraIcon className="w-4 h-4" />
                  Virtual
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-lg font-bold ${slot.bookings.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {slot.bookings.length} / {slot.maxBookings}
            </div>
            <div className="text-xs text-gray-500">signups</div>
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Booking List */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          {slot.bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No one has signed up for this slot yet
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Signups ({slot.bookings.length})
                </h4>
                {isCoffeeChat && (
                  <span className="text-xs text-gray-500 italic">
                    Give referrals for Phase 1 review scoring
                  </span>
                )}
              </div>
              {slot.bookings.map((booking) => {
                const currentReferral = referrals[booking._id!];
                const isSaving = savingReferral === booking._id;
                
                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-lg p-3 border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {booking.applicantName || 'Unknown'}
                          </div>
                          {booking.applicantEmail && (
                            <a
                              href={`mailto:${booking.applicantEmail}`}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <EnvelopeIcon className="w-3 h-3" />
                              {booking.applicantEmail}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Booked {new Date(booking.bookedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Referral Buttons - Only for coffee chats */}
                    {isCoffeeChat && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-medium">Referral:</span>
                          <div className="flex items-center gap-2">
                            {/* Thumbs Up - Referral */}
                            <button
                              onClick={() => onSaveReferral(booking._id!, 'referral')}
                              disabled={isSaving}
                              className={`p-2 rounded-lg transition-all ${
                                currentReferral?.signal === 'referral'
                                  ? 'bg-green-100 text-green-600 ring-2 ring-green-500'
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Positive referral (thumbs up)"
                            >
                              {currentReferral?.signal === 'referral' ? (
                                <HandThumbUpSolid className="w-5 h-5" />
                              ) : (
                                <HandThumbUpIcon className="w-5 h-5" />
                              )}
                            </button>
                            
                            {/* Neutral */}
                            <button
                              onClick={() => onSaveReferral(booking._id!, 'neutral')}
                              disabled={isSaving}
                              className={`p-2 rounded-lg transition-all ${
                                currentReferral?.signal === 'neutral'
                                  ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600'
                              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Neutral"
                            >
                              {currentReferral?.signal === 'neutral' ? (
                                <MinusSolid className="w-5 h-5" />
                              ) : (
                                <MinusIcon className="w-5 h-5" />
                              )}
                            </button>
                            
                            {/* Thumbs Down - Deferral */}
                            <button
                              onClick={() => onSaveReferral(booking._id!, 'deferral')}
                              disabled={isSaving}
                              className={`p-2 rounded-lg transition-all ${
                                currentReferral?.signal === 'deferral'
                                  ? 'bg-red-100 text-red-600 ring-2 ring-red-500'
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Negative referral (thumbs down)"
                            >
                              {currentReferral?.signal === 'deferral' ? (
                                <HandThumbDownSolid className="w-5 h-5" />
                              ) : (
                                <HandThumbDownIcon className="w-5 h-5" />
                              )}
                            </button>
                            
                            {isSaving && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-1"></div>
                            )}
                          </div>
                        </div>
                        {currentReferral && (
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            Current: {currentReferral.signal === 'referral' ? '👍 Positive' : 
                                     currentReferral.signal === 'deferral' ? '👎 Negative' : '➖ Neutral'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
