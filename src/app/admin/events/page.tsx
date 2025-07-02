'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function EventsAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showSubeventForm, setShowSubeventForm] = useState(null);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    // Let the API handle admin checking - just proceed if logged in
    console.log('User session:', session.user);
  }, [session, status]);

  // Load events
  useEffect(() => {
    if (session?.user) {
      loadEvents();
    }
  }, [session]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data && !data.error) {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadEvents();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'WORKSHOP': return 'bg-blue-100 text-blue-800';
      case 'SYMPOSIUM': return 'bg-purple-100 text-purple-800';
      case 'NETWORKING': return 'bg-green-100 text-green-800';
      case 'CONFERENCE': return 'bg-red-100 text-red-800';
      case 'MEETING': return 'bg-yellow-100 text-yellow-800';
      case 'SOCIAL': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage events and workshops ({events.length} total)</p>
        </div>
        {!showForm && !showSubeventForm && (
          <button
            onClick={() => {
              setEditingEvent(null);
              setShowSubeventForm(null);
              setShowForm(true);
            }}
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366]"
          >
            <PlusIcon className="w-4 h-4" />
            Add Event
          </button>
        )}
      </div>

      {/* Inline Form */}
      {(showForm || showSubeventForm) && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <EventForm
            event={editingEvent}
            parentEvent={showSubeventForm}
            onClose={() => {
              setShowForm(false);
              setEditingEvent(null);
              setShowSubeventForm(null);
            }}
            onSave={() => {
              loadEvents();
              setShowForm(false);
              setEditingEvent(null);
              setShowSubeventForm(null);
            }}
          />
        </div>
      )}

      {/* Events Grid */}
      <div className="grid gap-6">
        {events.map((event: any) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType}
                  </span>
                  {event.featured && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  )}
                  {!event.published && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      Draft
                    </span>
                  )}
                  {event.isMainEvent && event.subevents && event.subevents.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {event.subevents.length} subevents
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <p className="text-gray-900">{new Date(event.eventDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time:</span>
                    <p className="text-gray-900">{new Date(event.eventDate).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Capacity:</span>
                    <p className="text-gray-900">{event.capacity || 'Unlimited'}</p>
                  </div>
                </div>
                
                {event.venue && (
                  <div className="mt-2">
                    <span className="font-medium text-gray-700 text-sm">Venue:</span>
                    <span className="text-gray-900 text-sm ml-2">{event.venue}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                {event.isMainEvent && (
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setShowForm(false);
                      setShowSubeventForm(event);
                    }}
                    className="text-purple-600 hover:text-purple-900 p-2 bg-purple-50 rounded-lg"
                    title="Add Subevent"
                    disabled={showForm || !!showSubeventForm}
                  >
                    <span className="text-xs font-medium">+ Subevent</span>
                  </button>
                )}
                <a
                  href={`/events`}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="View Event"
                >
                  <EyeIcon className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setEditingEvent(event);
                    setShowSubeventForm(null);
                    setShowForm(true);
                  }}
                  className="text-green-600 hover:text-green-900 p-2"
                  title="Edit Event"
                  disabled={showForm || !!showSubeventForm}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete Event"
                  disabled={showForm || !!showSubeventForm}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subevents Section */}
            {event.isMainEvent && event.subevents && event.subevents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-sm text-gray-700 mb-3">Subevents</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.subevents.map((subevent: any) => (
                    <div key={subevent.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h6 className="font-medium text-sm text-gray-900">{subevent.title}</h6>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(subevent.eventDate).toLocaleDateString()} • {new Date(subevent.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {subevent.venue && (
                            <p className="text-xs text-gray-500">📍 {subevent.venue}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              setEditingEvent(subevent);
                              setShowSubeventForm(null);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit Subevent"
                            disabled={showForm || !!showSubeventForm}
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => deleteEvent(subevent.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete Subevent"
                            disabled={showForm || !!showSubeventForm}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{subevent.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${getEventTypeColor(subevent.eventType)}`}>
                          {subevent.eventType}
                        </span>
                        <span>{subevent.capacity ? `${subevent.capacity} capacity` : 'No limit'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {events.length === 0 && !showForm && !showSubeventForm && (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-4">Create your first event to get started.</p>
          <button
            onClick={() => {
              setEditingEvent(null);
              setShowSubeventForm(null);
              setShowForm(true);
            }}
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366]"
          >
            Add Event
          </button>
        </div>
      )}
    </div>
  );
}

function EventForm({ event, onClose, onSave, parentEvent }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    endDate: '',
    location: '',
    venue: '',
    capacity: '',
    registrationUrl: '',
    eventType: 'WORKSHOP',
    imageUrl: '',
    featured: false,
    published: true,
    parentEventId: null
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        venue: event.venue || '',
        capacity: event.capacity?.toString() || '',
        registrationUrl: event.registrationUrl || '',
        eventType: event.eventType || 'WORKSHOP',
        imageUrl: event.imageUrl || '',
        featured: event.featured || false,
        published: event.published ?? true,
        parentEventId: event.parentEventId || null
      });
    } else if (parentEvent) {
      // Pre-fill some fields from parent event when creating subevent
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        endDate: '',
        location: parentEvent.location || '',
        venue: '',
        capacity: '',
        registrationUrl: '',
        eventType: 'WORKSHOP',
        imageUrl: '',
        featured: false,
        published: true,
        parentEventId: parentEvent.id
      });
    }
  }, [event, parentEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      };

      let url = '/api/admin/events';
      let method = 'POST';

      // If editing an existing event
      if (event) {
        url = `/api/admin/events?id=${event.id}`;
        method = 'PUT';
      }
      // If creating a subevent
      else if (parentEvent) {
        url = `/api/admin/events/${parentEvent.id}/subevents`;
        method = 'POST';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
      } else {
        const error = await res.json();
        alert(error.message || 'Error saving event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {event ? 'Edit Event' : parentEvent ? `Add Subevent for "${parentEvent.title}"` : 'Add Event'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
            ✓ Changes saved automatically
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="WORKSHOP">Workshop</option>
                <option value="SYMPOSIUM">Symposium</option>
                <option value="NETWORKING">Networking</option>
                <option value="CONFERENCE">Conference</option>
                <option value="MEETING">Meeting</option>
                <option value="SOCIAL">Social</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., University of Michigan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., Mason Hall 1300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Max attendees"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration URL</label>
              <input
                type="url"
                value={formData.registrationUrl}
                onChange={(e) => setFormData({...formData, registrationUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-6 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm text-gray-700">Featured Event</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({...formData, published: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
          </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#00274c] text-white hover:bg-[#003366] rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : (event ? 'Update Event' : parentEvent ? 'Add Subevent' : 'Add Event')}
          </button>
        </div>
      </form>
    </div>
  );
} 