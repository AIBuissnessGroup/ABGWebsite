'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState, AdminEmptyState } from '@/components/admin/ui';
import type { RecruitmentSlot, SlotKind, SlotBooking, ApplicationTrack } from '@/types/recruitment';

const SLOT_KINDS: { value: SlotKind; label: string; color: string }[] = [
  { value: 'coffee_chat', label: 'Coffee Chat', color: 'bg-amber-100 text-amber-800' },
  { value: 'interview_round1', label: 'Interview Round 1', color: 'bg-blue-100 text-blue-800' },
  { value: 'interview_round2', label: 'Interview Round 2', color: 'bg-purple-100 text-purple-800' },
];

import { TRACK_FILTER_OPTIONS, getTrackShortLabel } from '@/lib/tracks';

const TRACKS = TRACK_FILTER_OPTIONS;

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Generate Google Calendar link with both host and applicant
function generateGCalLink(slot: RecruitmentSlot, applicantName: string, applicantEmail: string): string {
  const kindInfo = SLOT_KINDS.find(k => k.value === slot.kind);
  const start = new Date(slot.startTime);
  const end = new Date(start.getTime() + (slot.durationMinutes || 30) * 60000);
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGCalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const title = encodeURIComponent(`ABG ${kindInfo?.label || slot.kind}: ${applicantName} & ${slot.hostName}`);
  const details = encodeURIComponent(
    `${kindInfo?.label || slot.kind} between ${applicantName} and ${slot.hostName}\n\n` +
    `Applicant: ${applicantName} (${applicantEmail})\n` +
    `Host: ${slot.hostName} (${slot.hostEmail})\n` +
    (slot.meetingUrl ? `\nJoin: ${slot.meetingUrl}` : '')
  );
  const locationStr = encodeURIComponent(slot.location || slot.meetingUrl || 'TBD');
  
  // Add both applicant and host as guests (comma-separated, then encoded)
  const guests = encodeURIComponent(`${applicantEmail},${slot.hostEmail}`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${details}&location=${locationStr}&add=${guests}`;
}

interface SlotWithBookings extends RecruitmentSlot {
  bookings?: SlotBooking[];
}

export default function CycleSlotsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get, post, put, del } = useAdminApi();
  
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKind, setFilterKind] = useState<SlotKind | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<RecruitmentSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBookings | null>(null);
  const [formData, setFormData] = useState({
    kind: 'coffee_chat' as SlotKind,
    hostName: '',
    hostEmail: '',
    startTime: '',
    durationMinutes: 30,
    location: '',
    meetingUrl: '',
    forTrack: '' as ApplicationTrack | '',
    maxBookings: 1,
    notes: '',
  });

  const loadSlots = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/recruitment/slots?cycleId=${cycleId}&includeBookings=true`;
      if (filterKind) url += `&kind=${filterKind}`;
      const data = await get<SlotWithBookings[]>(url);
      setSlots(data);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadSlots();
    }
  }, [cycleId, filterKind]);

  const resetForm = () => {
    setFormData({
      kind: 'coffee_chat',
      hostName: '',
      hostEmail: '',
      startTime: '',
      durationMinutes: 30,
      location: '',
      meetingUrl: '',
      forTrack: '',
      maxBookings: 1,
      notes: '',
    });
    setEditingSlot(null);
    setShowForm(false);
  };

  const handleEdit = (slot: RecruitmentSlot) => {
    setEditingSlot(slot);
    setFormData({
      kind: slot.kind,
      hostName: slot.hostName,
      hostEmail: slot.hostEmail,
      startTime: new Date(slot.startTime).toISOString().slice(0, 16),
      durationMinutes: slot.durationMinutes,
      location: slot.location || '',
      meetingUrl: slot.meetingUrl || '',
      forTrack: slot.forTrack || '',
      maxBookings: slot.maxBookings,
      notes: slot.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        cycleId,
        startTime: new Date(formData.startTime).toISOString(),
        forTrack: formData.forTrack || undefined,
      };

      if (editingSlot) {
        await put(`/api/admin/recruitment/slots/${editingSlot._id}`, payload, {
          successMessage: 'Slot updated successfully',
        });
      } else {
        await post('/api/admin/recruitment/slots', payload, {
          successMessage: 'Slot created successfully',
        });
      }
      
      resetForm();
      loadSlots();
    } catch (error) {
      console.error('Error saving slot:', error);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot? Any bookings will be cancelled.')) return;
    
    try {
      await del(`/api/admin/recruitment/slots/${slotId}`, {
        successMessage: 'Slot deleted successfully',
      });
      loadSlots();
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const generateBulkSlots = () => {
    // TODO: Implement bulk slot generation modal
    toast.error('Bulk slot generation coming soon');
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, SlotWithBookings[]>);

  if (loading) {
    return <AdminLoadingState message="Loading slots..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Interview & Coffee Chat Slots</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage available time slots for coffee chats and interviews
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as SlotKind | '')}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {SLOT_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>{kind.label}</option>
            ))}
          </select>
          <button
            onClick={generateBulkSlots}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Bulk Generate
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Slot
          </button>
        </div>
      </div>

      {slots.length === 0 ? (
        <AdminEmptyState
          title="No slots yet"
          description="Create time slots for coffee chats and interviews"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Slot
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(slotsByDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dateSlots]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="grid gap-3">
                  {dateSlots
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((slot) => {
                      const kindInfo = SLOT_KINDS.find(k => k.value === slot.kind);
                      const isBooked = slot.bookedCount >= slot.maxBookings;
                      const isPast = new Date(slot.startTime) < new Date();
                      
                      return (
                        <div
                          key={slot._id}
                          className={`bg-white rounded-xl border p-4 ${isPast ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${kindInfo?.color}`}>
                                  {kindInfo?.label}
                                </span>
                                {slot.forTrack && (
                                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                                    {getTrackShortLabel(slot.forTrack)}
                                  </span>
                                )}
                                {isBooked && (
                                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                    Booked
                                  </span>
                                )}
                              </div>
                              
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-gray-900">
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                  {formatDateTime(slot.startTime)} ({formatDuration(slot.durationMinutes)})
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <UserIcon className="w-4 h-4 text-gray-400" />
                                  {slot.hostName} ({slot.hostEmail})
                                </div>
                                {slot.location && (
                                  <p className="text-sm text-gray-500">📍 {slot.location}</p>
                                )}
                                {slot.meetingUrl && (
                                  <a
                                    href={slot.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    🔗 Meeting Link
                                  </a>
                                )}
                              </div>

                              <div className="mt-3 text-sm text-gray-500">
                                {slot.bookedCount} / {slot.maxBookings} booked
                              </div>

                              {/* Show bookings inline */}
                              {slot.bookings && slot.bookings.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                  <p className="text-xs font-semibold text-gray-500 uppercase">Booked by:</p>
                                  {slot.bookings.filter(b => b.status === 'confirmed').map((booking) => (
                                    <div key={booking._id} className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm truncate">{booking.applicantName}</p>
                                        <a 
                                          href={`mailto:${booking.applicantEmail}`}
                                          className="text-xs text-blue-600 hover:underline truncate block"
                                        >
                                          {booking.applicantEmail}
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 ml-2">
                                        {booking.calendarEventLink ? (
                                          <a
                                            href={booking.calendarEventLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                            title="View in Calendar"
                                          >
                                            <CalendarDaysIcon className="w-3 h-3" />
                                            View
                                          </a>
                                        ) : (
                                          <a
                                            href={generateGCalLink(slot, booking.applicantName, booking.applicantEmail)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                                            title="Add to Google Calendar (includes both attendees)"
                                          >
                                            <CalendarDaysIcon className="w-3 h-3" />
                                            Add to GCal
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => handleEdit(slot)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(slot._id!)}
                                className="p-2 text-red-400 hover:text-red-600"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add/Edit Slot Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingSlot ? 'Edit Slot' : 'Add New Slot'}
              </h3>
              <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value as SlotKind })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {SLOT_KINDS.map((kind) => (
                    <option key={kind.value} value={kind.value}>{kind.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host Name</label>
                  <input
                    type="text"
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host Email</label>
                  <input
                    type="email"
                    value={formData.hostEmail}
                    onChange={(e) => setFormData({ ...formData, hostEmail: e.target.value })}
                    placeholder="john@umich.edu"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                  <select
                    value={formData.forTrack}
                    onChange={(e) => setFormData({ ...formData, forTrack: e.target.value as ApplicationTrack | '' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {TRACKS.map((track) => (
                      <option key={track.value} value={track.value}>{track.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Bookings</label>
                  <input
                    type="number"
                    value={formData.maxBookings}
                    onChange={(e) => setFormData({ ...formData, maxBookings: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Ross School of Business, Room 1220"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL</label>
                <input
                  type="url"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional information for admins..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bookings Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Bookings</h3>
              <button onClick={() => setSelectedSlot(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {SLOT_KINDS.find(k => k.value === selectedSlot.kind)?.label} with {selectedSlot.hostName}
                </p>
                <p className="text-sm text-gray-500">{formatDateTime(selectedSlot.startTime)}</p>
              </div>

              {selectedSlot.bookings && selectedSlot.bookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedSlot.bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{booking.applicantName}</p>
                          <a 
                            href={`mailto:${booking.applicantEmail}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {booking.applicantEmail}
                          </a>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      {booking.calendarEventLink && booking.status === 'confirmed' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <a
                            href={booking.calendarEventLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <CalendarDaysIcon className="w-4 h-4" />
                            View in Calendar
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No bookings yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
