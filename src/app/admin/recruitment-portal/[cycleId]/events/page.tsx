'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState, AdminEmptyState } from '@/components/admin/ui';
import type { RecruitmentEvent, EventRsvp } from '@/types/recruitment';

export default function CycleEventsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get, post, put, del } = useAdminApi();
  
  const [events, setEvents] = useState<RecruitmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RecruitmentEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RecruitmentEvent | null>(null);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
    venue: '',
    capacity: '',
    rsvpEnabled: true,
    rsvpDeadline: '',
    checkInEnabled: false,
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await get<RecruitmentEvent[]>(`/api/admin/recruitment/portal-events?cycleId=${cycleId}`);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRsvps = async (eventId: string) => {
    try {
      setLoadingRsvps(true);
      const data = await get<EventRsvp[]>(`/api/admin/recruitment/rsvps?eventId=${eventId}`);
      setRsvps(data);
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    } finally {
      setLoadingRsvps(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadEvents();
    }
  }, [cycleId]);

  useEffect(() => {
    if (selectedEvent) {
      loadRsvps(selectedEvent._id!.toString());
    }
  }, [selectedEvent]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      location: '',
      venue: '',
      capacity: '',
      rsvpEnabled: true,
      rsvpDeadline: '',
      checkInEnabled: false,
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: RecruitmentEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startAt: formatDateForInput(new Date(event.startAt)),
      endAt: formatDateForInput(new Date(event.endAt)),
      location: event.location || '',
      venue: event.venue || '',
      capacity: event.capacity?.toString() || '',
      rsvpEnabled: event.rsvpEnabled ?? true,
      rsvpDeadline: event.rsvpDeadline ? formatDateForInput(new Date(event.rsvpDeadline)) : '',
      checkInEnabled: event.checkInEnabled ?? false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        cycleId,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        rsvpDeadline: formData.rsvpDeadline ? new Date(formData.rsvpDeadline).toISOString() : undefined,
      };

      if (editingEvent) {
        await put(`/api/admin/recruitment/portal-events/${editingEvent._id}`, data, {
          successMessage: 'Event updated successfully',
        });
      } else {
        await post('/api/admin/recruitment/portal-events', data, {
          successMessage: 'Event created successfully',
        });
      }
      
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async (event: RecruitmentEvent) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
    
    try {
      await del(`/api/admin/recruitment/portal-events/${event._id}`, {
        successMessage: 'Event deleted successfully',
      });
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleMarkAttendance = async (rsvpId: string, attended: boolean) => {
    try {
      await post('/api/admin/recruitment/rsvps', { rsvpId, attended }, {
        successMessage: attended ? 'Marked as attended' : 'Attendance removed',
      });
      if (selectedEvent) {
        loadRsvps(selectedEvent._id!.toString());
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  const formatDisplayDate = (dateStr: string | Date): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <AdminLoadingState message="Loading events..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recruitment Events</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Meet the Members"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
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
                  placeholder="Ross School of Business"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue/Room</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Room 1230"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (optional)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="50"
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rsvpEnabled"
                  checked={formData.rsvpEnabled}
                  onChange={(e) => setFormData({ ...formData, rsvpEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="rsvpEnabled" className="text-sm text-gray-700">
                  Enable RSVP
                </label>
              </div>

              {formData.rsvpEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.rsvpDeadline}
                    onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Check-in Settings */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="checkInEnabled"
                    checked={formData.checkInEnabled}
                    onChange={(e) => setFormData({ ...formData, checkInEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="checkInEnabled" className="text-sm font-medium text-gray-700">
                    Enable Check-in (Photo Required)
                  </label>
                </div>
                
                {formData.checkInEnabled && (
                  <p className="text-xs text-gray-500 ml-6">Attendees will take a photo to check in at the event</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RSVP Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                <p className="text-gray-500">{formatDisplayDate(selectedEvent.startAt)}</p>
                {selectedEvent.checkInEnabled && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Photo check-in enabled
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {loadingRsvps ? (
              <div className="py-8 text-center text-gray-500">Loading RSVPs...</div>
            ) : rsvps.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No RSVPs yet</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{rsvps.length} RSVP{rsvps.length !== 1 ? 's' : ''}</span>
                  <span>
                    {rsvps.filter(r => r.checkedInAt).length} checked in
                    {' · '}
                    {rsvps.filter(r => r.attendedAt && !r.checkedInAt).length} marked attended
                  </span>
                </div>
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp._id?.toString()}
                    className={`p-3 rounded-lg border ${
                      rsvp.checkedInAt ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {/* Check-in Photo */}
                        {rsvp.checkInPhoto ? (
                          <img 
                            src={rsvp.checkInPhoto} 
                            alt={`${rsvp.applicantName} check-in`}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <UserGroupIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{rsvp.applicantName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{rsvp.applicantEmail || rsvp.userId}</p>
                          {rsvp.checkedInAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Checked in at {new Date(rsvp.checkedInAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rsvp.checkedInAt ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
                            <CheckCircleIcon className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkAttendance(rsvp._id!.toString(), !rsvp.attendedAt)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                              rsvp.attendedAt
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            {rsvp.attendedAt ? 'Attended' : 'Mark Attended'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <AdminEmptyState
          title="No Events"
          description="Create your first recruitment event"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Event
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event._id?.toString()}
              className="bg-white rounded-xl border p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDisplayDate(event.startAt)} - {formatDisplayDate(event.endAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {event.location}{event.venue && ` • ${event.venue}`}
                  </p>
                  {event.rsvpEnabled && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      <UserGroupIcon className="w-3 h-3" />
                      RSVP Enabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {event.rsvpEnabled && (
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View RSVPs"
                    >
                      <UserGroupIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
