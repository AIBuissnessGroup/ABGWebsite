'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserPlusIcon,
  UserGroupIcon,
  XMarkIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { USER_ROLES, getRoleDisplayName } from '@/lib/roles';
import { useAdminApi, useAdminQuery } from '@/hooks/useAdminApi';
import { AdminSection, AdminEmptyState, AdminLoadingState } from '@/components/admin/ui';

// Waitlist interfaces
interface WaitlistPerson {
  _id: string;
  id: string;
  eventId: string;
  attendee: {
    name: string;
    umichEmail: string;
    major: string | null;
    gradeLevel: string | null;
  };
  status: string;
  waitlistPosition: number;
  registeredAt: number;
  source: string;
  reminders: {
    emailSent: boolean;
    smsSent: boolean;
  };
  checkInCode: string;
}

interface EventWaitlist {
  id: string;
  title: string;
  eventDate: string;
  eventType: string;
  capacity: number;
  waitlistMaxSize: number;
  confirmedCount: number;
  waitlistCount: number;
  canPromote: boolean;
  waitlistSpots: WaitlistPerson[];
}

interface WaitlistData {
  totalWaitlisted: number;
  eventsWithWaitlists: number;
  promotableEvents: number;
  waitlistByType: Record<string, { events: number; waitlisted: number }>;
  events: EventWaitlist[];
}

// Helper functions for Eastern Time (EST/EDT) timezone handling
const formatDateForInput = (utcDate: Date): string => {
  // Convert UTC date to Eastern Time for display in datetime-local input
  
  // Use the most direct approach: convert UTC to Eastern using built-in methods
  const easternTimeString = utcDate.toLocaleString('sv-SE', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // sv-SE format gives us "YYYY-MM-DD HH:mm" - just replace space with T
  const result = easternTimeString.replace(' ', 'T');
  
  return result;
};

const parseDateFromInput = (dateString: string): Date => {
  // Parse datetime-local input as Eastern Time and convert to UTC
  if (!dateString) return new Date();
  
  
  // Simple approach: create the date assuming it's in Eastern Time, then convert to UTC
  // We'll use the Date constructor but manually calculate the Eastern offset
  
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // For October 17, 2025, we know we're in Eastern Daylight Time (EDT = UTC-4)
  // But let's calculate it dynamically to handle any date
  
  // Create a test date to determine if we're in DST
  const testDate = new Date(year, month - 1, day, 12, 0, 0);
  
  // Check if this date is in DST by comparing January and July offsets
  const janOffset = new Date(year, 0, 1).getTimezoneOffset();
  const julOffset = new Date(year, 6, 1).getTimezoneOffset();
  const isDST = testDate.getTimezoneOffset() < Math.max(janOffset, julOffset);
  
  // For Eastern Time: EST = UTC-5, EDT = UTC-4
  const offsetHours = isDST ? 4 : 5;
  
  // Create the date in UTC by adding the offset
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour + offsetHours, minute, 0, 0));
  
  
  return utcDate;
};

// Helper function to convert UTC dates to EST for display
const convertUtcToEst = (utcDate: Date): Date => {
  const estOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  return new Date(utcDate.getTime() - estOffset);
};

export default function EventsAdmin() {
  const { data: session, status } = useSession();
  const { get, post, del } = useAdminApi();
  const {
    data: eventsData,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useAdminQuery<any[]>(status === 'authenticated' ? '/api/admin/events' : null, {
    enabled: status === 'authenticated',
    skipErrorToast: true,
  });
  const events = useMemo(() => eventsData ?? [], [eventsData]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showSubeventForm, setShowSubeventForm] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'analytics' | 'waitlist' | 'registrations'>('events');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [registrationsData, setRegistrationsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [promoting, setPromoting] = useState<string | null>(null);
  const [viewingAttendees, setViewingAttendees] = useState<string | null>(null);
  const [attendeesData, setAttendeesData] = useState<any>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Restore form state on mount
  useEffect(() => {
    try {
      const savedFormState = localStorage.getItem('eventsAdmin_formState');
      if (savedFormState) {
        const { showForm: savedShowForm, showSubeventForm: savedShowSubeventForm, editingEventId, parentEventId } = JSON.parse(savedFormState);
        // Only restore if user explicitly had a form open, not just because they clicked somewhere
        if ((savedShowForm || savedShowSubeventForm) && events.length > 0) {
          if (savedShowSubeventForm && parentEventId) {
            const parentEvent = events.find(e => e.id === parentEventId);
            if (parentEvent) {
              setShowSubeventForm(parentEvent);
            }
          } else if (savedShowForm) {
            setShowForm(true);
            if (editingEventId) {
              // Find the event to edit (could be main event or subevent)
              let eventToEdit = events.find(e => e.id === editingEventId);
              if (!eventToEdit) {
                // Check subevents
                for (const event of events) {
                  if (event.subevents) {
                    eventToEdit = event.subevents.find((sub: any) => sub.id === editingEventId);
                    if (eventToEdit) break;
                  }
                }
              }
              if (eventToEdit) {
                setEditingEvent(eventToEdit);
              }
            } else {
            }
          }
        }
      }
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }, [events]);

  // Save form state whenever it changes
  useEffect(() => {
    try {
      const formState = {
        showForm,
        showSubeventForm: !!showSubeventForm,
        editingEventId: editingEvent?.id || null,
        parentEventId: showSubeventForm?.id || null
      };
      if (showForm || showSubeventForm || editingEvent) {
        localStorage.setItem('eventsAdmin_formState', JSON.stringify(formState));
      } else {
        localStorage.removeItem('eventsAdmin_formState');
      }
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }, [showForm, showSubeventForm, editingEvent]);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await get('/api/admin/analytics', { skipErrorToast: true });
      if (data) {
        setAnalyticsData(data);
      }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadWaitlistData = async () => {
    setLoadingWaitlist(true);
    try {
      const data = await get('/api/admin/waitlists', { skipErrorToast: true });
      if (data) {
        setWaitlistData(data as WaitlistData);
      }
    } catch {
      toast.error('Failed to load waitlist data');
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const loadRegistrationsData = async () => {
    setLoadingRegistrations(true);
    try {
      const data = await get('/api/admin/registrations', { skipErrorToast: true });
      if (data) {
        setRegistrationsData(data);
      }
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const promoteFromWaitlist = async (eventId: string, attendanceId: string) => {
    if (!confirm('Are you sure you want to promote this person from the waitlist?')) {
      return;
    }

    setPromoting(attendanceId);
    try {
      await post('/api/admin/waitlists', { eventId, attendanceId }, { successMessage: 'Person promoted successfully!' });
      loadWaitlistData();
    } catch {
      toast.error('Failed to promote person');
    } finally {
      setPromoting(null);
    }
  };

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const formatDate = (timestamp: string | number) => {
    const utcDate = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    const estDate = convertUtcToEst(utcDate);
    return estDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  const loadEventAttendees = async (eventId: string) => {
    setLoadingAttendees(true);
    try {
      const data = await get(`/api/admin/events/${eventId}/attendance`, { skipErrorToast: true });
      if (data) {
        setAttendeesData(data);
      }
    } catch {
      toast.error('Failed to load attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const removeAttendee = async (eventId: string, attendanceId: string) => {
    if (!confirm('Are you sure you want to remove this person from the event?')) {
      return;
    }

    try {
      const result = await del<{ message?: string }>(`/api/admin/events/${eventId}/attendees`, {
        body: JSON.stringify({ attendanceId }),
      });
      if (result?.message) {
        toast.success(result.message);
      } else {
        toast.success('Attendee removed');
      }
      loadEventAttendees(eventId);
    } catch {
      toast.error('Failed to remove attendee');
    }
  };

  const promoteAttendee = async (eventId: string, attendanceId: string) => {
    if (!confirm('Are you sure you want to promote this person from the waitlist?')) {
      return;
    }

    try {
      const result = await post<{ message?: string }>(`/api/admin/events/${eventId}/attendees`, {
        action: 'promote',
        attendanceId,
      });
      toast.success(result?.message || 'Attendee promoted');
      loadEventAttendees(eventId);
    } catch {
      toast.error('Failed to promote attendee');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (session?.user) {
      if (activeTab === 'analytics' && !analyticsData) {
        loadAnalytics();
      } else if (activeTab === 'waitlist' && !waitlistData) {
        loadWaitlistData();
      } else if (activeTab === 'registrations' && !registrationsData) {
        loadRegistrationsData();
      }
    }
  }, [activeTab, session]);

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await del(`/api/admin/events?id=${id}`);
      toast.success('Event deleted');
      refetchEvents();
    } catch {
      toast.error('Failed to delete event');
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

  if (status === 'loading' || eventsLoading) {
    return <AdminLoadingState fullHeight message="Loading events..." />;
  }

  if (eventsError) {
    return (
      <AdminEmptyState
        title="Unable to load events"
        description={eventsError.message}
        action={
          <button
            onClick={refetchEvents}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      {!showForm && !showSubeventForm && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'waitlist'
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Waitlists
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'registrations'
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Registrations
            </button>
          </nav>
        </div>
      )}

      {/* Import Panel */}
      {showImport && !showForm && !showSubeventForm && activeTab === 'events' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Bulk Upload Events (CSV)</h3>
            <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowImport(false)}>Close</button>
          </div>
          <div className="text-sm text-gray-700 mb-3">
            Required headers: <code className="bg-gray-100 px-1 rounded">title</code>, <code className="bg-gray-100 px-1 rounded">description</code>, <code className="bg-gray-100 px-1 rounded">eventDate</code>, <code className="bg-gray-100 px-1 rounded">location</code>, <code className="bg-gray-100 px-1 rounded">eventType</code>. Optional: <code className="bg-gray-100 px-1 rounded">endDate</code>, <code className="bg-gray-100 px-1 rounded">venue</code>, <code className="bg-gray-100 px-1 rounded">capacity</code>, <code className="bg-gray-100 px-1 rounded">registrationUrl</code>, <code className="bg-gray-100 px-1 rounded">imageUrl</code>, <code className="bg-gray-100 px-1 rounded">featured</code>, <code className="bg-gray-100 px-1 rounded">published</code>. Event types: WORKSHOP, SYMPOSIUM, NETWORKING, CONFERENCE, MEETING, SOCIAL.
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#00274c] file:text-white hover:file:bg-[#003366]"
            />
            <button
              disabled={!importFile || importing}
              onClick={async () => {
                if (!importFile) return;
                setImporting(true);
                setImportResult(null);
                try {
                  const form = new FormData();
                  form.append('file', importFile);
                  const json = await post('/api/admin/events/import', form, {
                    parseAs: 'json',
                    skipErrorToast: true,
                  });
                  setImportResult(json);
                  if (json?.success) {
                    await refetchEvents();
                    toast.success('Events imported');
                  }
                } catch {
                  setImportResult({ error: 'Upload failed' });
                  toast.error('Failed to import events');
                } finally {
                  setImporting(false);
                }
              }}
              className="px-4 py-2 rounded-md bg-[#00274c] text-white hover:bg-[#003366] disabled:opacity-50"
            >
              {importing ? 'Uploading…' : 'Upload CSV'}
            </button>
          </div>
          {importResult && (
            <div className="mt-3 text-sm">
              <pre className="bg-gray-50 p-3 rounded border overflow-auto max-h-64">{JSON.stringify(importResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

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
              // Clear form state from localStorage
              localStorage.removeItem('eventsAdmin_formState');
            }}
            onSave={() => {
              refetchEvents();
              setShowForm(false);
              setEditingEvent(null);
              setShowSubeventForm(null);
              // Clear form state from localStorage
              localStorage.removeItem('eventsAdmin_formState');
            }}
          />
        </div>
      )}

      {/* Attendee Management Modal */}
      {viewingAttendees && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              setViewingAttendees(null);
              setAttendeesData(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manage Attendees & Send Updates</h2>
                <button
                  onClick={() => {
                    setViewingAttendees(null);
                    setAttendeesData(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                  title="Close modal"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingAttendees ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c]"></div>
                  <span className="ml-2">Loading attendees...</span>
                </div>
              ) : attendeesData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Attendee Management */}
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {attendeesData.confirmed?.length || 0}
                        </div>
                        <div className="text-sm text-green-600">Confirmed</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {attendeesData.waitlisted?.length || 0}
                        </div>
                        <div className="text-sm text-yellow-600">Waitlisted</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(attendeesData.confirmed?.length || 0) + (attendeesData.waitlisted?.length || 0)}
                        </div>
                        <div className="text-sm text-blue-600">Total</div>
                      </div>
                    </div>

                    {/* Confirmed Attendees */}
                    {attendeesData.confirmed && attendeesData.confirmed.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-600">
                          Confirmed Attendees ({attendeesData.confirmed.length})
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {attendeesData.confirmed.map((attendee: any) => (
                            <div key={attendee._id} className="flex items-center justify-between bg-green-50 p-3 rounded">
                              <div>
                                <div className="font-medium">{attendee.attendee?.name || 'No name'}</div>
                                <div className="text-sm text-gray-600">{attendee.attendee?.umichEmail}</div>
                                <div className="text-xs text-gray-500">
                                  {attendee.attendee?.major} • Grade {attendee.attendee?.gradeLevel}
                                </div>
                              </div>
                              <button
                                onClick={() => removeAttendee(viewingAttendees, attendee._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <XMarkIcon className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Waitlisted Attendees */}
                    {attendeesData.waitlisted && attendeesData.waitlisted.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-yellow-600">
                          Waitlisted Attendees ({attendeesData.waitlisted.length})
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {attendeesData.waitlisted.map((attendee: any) => (
                            <div key={attendee._id} className="flex items-center justify-between bg-yellow-50 p-3 rounded">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  #{attendee.waitlistPosition}
                                </div>
                                <div>
                                  <div className="font-medium">{attendee.attendee?.name || 'No name'}</div>
                                  <div className="text-sm text-gray-600">{attendee.attendee?.umichEmail}</div>
                                  <div className="text-xs text-gray-500">
                                    {attendee.attendee?.major} • Grade {attendee.attendee?.gradeLevel}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => promoteAttendee(viewingAttendees, attendee._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  <UserPlusIcon className="w-4 h-4" />
                                  Promote
                                </button>
                                <button
                                  onClick={() => removeAttendee(viewingAttendees, attendee._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {attendeesData.confirmed?.length === 0 && attendeesData.waitlisted?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No attendees found for this event
                      </div>
                    )}
                  </div>

                  {/* Right Column: Send Updates */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 text-blue-600">Send Event Update</h3>
                      
                      <form className="space-y-4" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const title = formData.get('title') as string;
                        const message = formData.get('message') as string;
                        const recipients = formData.get('recipients') as string;
                        const type = formData.get('type') as string;
                        
                        if (!title || !message) {
                          toast.error('Please fill in all fields');
                          return;
                        }
                        
                        try {
                          // Send web update
                          const updateResult = await post<{ recipientCount: number }>(
                            `/api/events/${viewingAttendees}/updates`,
                            { title, message, recipients, type },
                            { skipErrorToast: true }
                          );

                          if (updateResult) {
                            toast.success(`Update sent to ${updateResult.recipientCount} attendees`);
                          } else {
                            toast.error('Failed to send update');
                          }

                          (e.target as HTMLFormElement).reset();
                        } catch {
                          toast.error('Failed to send update');
                        }
                      }}>
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">Update Title</label>
                          <input
                            type="text"
                            name="title"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Enter update title..."
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">Message</label>
                          <textarea
                            name="message"
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Enter your message..."
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">Send To</label>
                          <select
                            name="recipients"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                          >
                            <option value="all">All attendees</option>
                            <option value="confirmed">Confirmed attendees only</option>
                            <option value="waitlist">Waitlist members only</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">Update Type</label>
                          <select
                            name="type"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          >
                            <option value="info">Information</option>
                            <option value="reminder">Reminder</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                        >
                          Send Update
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load attendee data
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {activeTab === 'events' && (
        <AdminSection
          title="Events"
          description={`Manage events and workshops (${events.length} total)`}
          actions={
            !showForm &&
            !showSubeventForm && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowImport((v) => !v)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Bulk Upload CSV
                </button>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setShowSubeventForm(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white hover:bg-[#01305e]"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Event
                </button>
              </div>
            )
          }
        >
          {events.length === 0 && !showForm && !showSubeventForm ? (
            <AdminEmptyState
              icon={<CalendarIcon className="w-12 h-12 text-gray-400" />}
              title="No events yet"
              description="Create your first event to get started."
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white hover:bg-[#01305e]"
                >
                  Add Event
                </button>
              }
            />
          ) : (
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
                    <p className="text-gray-900">{new Date(event.eventDate).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time:</span>
                    <p className="text-gray-900">{new Date(event.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</p>
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

                {/* Attendance Information */}
                {event.attendanceConfirmEnabled && (
                  <div className="space-y-3">
                    <AttendanceInfo eventId={event.id} />
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
                  onClick={() => {
                    setViewingAttendees(event.id);
                    loadEventAttendees(event.id);
                  }}
                  className="text-purple-600 hover:text-purple-900 p-2"
                  title="Manage Attendees"
                  disabled={showForm || !!showSubeventForm}
                >
                  <UserGroupIcon className="w-4 h-4" />
                </button>
                {event.attendanceConfirmEnabled && (
                  <a
                    href={`/admin/events/${event.id}/checkin`}
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="Event Check-In"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                  </a>
                )}
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
                            {new Date(subevent.eventDate).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} • {new Date(subevent.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET
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
    )}
        </AdminSection>
      )}
      {/* End Events Tab */}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Analytics</h2>
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c]"></div>
                <span className="ml-2 text-gray-600">Loading analytics...</span>
              </div>
            ) : analyticsData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.totalEvents || 0}</div>
                    <div className="text-sm text-blue-600">Total Events</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.totalAttendees || 0}</div>
                    <div className="text-sm text-green-600">Total Attendees</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analyticsData.averageAttendance || 0}%</div>
                    <div className="text-sm text-purple-600">Avg Attendance Rate</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analyticsData.upcomingEvents || 0}</div>
                    <div className="text-sm text-orange-600">Upcoming Events</div>
                  </div>
                </div>
                
                {analyticsData.eventBreakdown && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Events by Type</h3>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.eventBreakdown).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-gray-600">{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No analytics data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waitlist Tab */}
      {activeTab === 'waitlist' && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Total Waitlisted</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {waitlistData?.totalWaitlisted || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Events with Waitlists</h3>
              <p className="text-3xl font-bold text-blue-600">
                {waitlistData?.eventsWithWaitlists || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Can Promote People</h3>
              <p className="text-3xl font-bold text-green-600">
                {waitlistData?.promotableEvents || 0}
              </p>
            </div>
          </div>

          {/* Events with Waitlists */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Events with Waitlists</h2>
            
            {loadingWaitlist ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c]"></div>
                <span className="ml-2 text-gray-600">Loading waitlists...</span>
              </div>
            ) : waitlistData && waitlistData.events && waitlistData.events.length > 0 ? (
              <div className="space-y-4">
                {waitlistData.events.map((event: EventWaitlist) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleEventExpanded(event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {formatDate(event.eventDate)} • {event.eventType}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600 font-medium">
                              {event.confirmedCount} confirmed
                            </span>
                            <span className="text-yellow-600 font-medium">
                              {event.waitlistCount} waitlisted
                            </span>
                            {event.capacity && (
                              <span className="text-gray-500">
                                Capacity: {event.capacity}
                              </span>
                            )}
                            {event.canPromote && event.waitlistCount > 0 && (
                              <span className="text-green-600 font-semibold">
                                Can promote!
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedEvents.has(event.id) ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedEvents.has(event.id) && event.waitlistSpots.length > 0 && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <h4 className="text-lg font-semibold mb-4 text-gray-900">Waitlist Queue</h4>
                          <div className="space-y-3">
                            {event.waitlistSpots.map((person) => (
                              <div 
                                key={person._id} 
                                className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    #{person.waitlistPosition}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {person.attendee?.name || 'No name'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {person.attendee?.umichEmail}
                                    </p>
                                    {person.attendee?.major && (
                                      <p className="text-sm text-gray-500">
                                        {person.attendee.major} • Grade {person.attendee.gradeLevel}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    Registered {convertUtcToEst(new Date(person.registeredAt)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                                  </span>
                                  {event.canPromote && person.waitlistPosition === 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        promoteFromWaitlist(event.id, person._id);
                                      }}
                                      disabled={promoting === person._id}
                                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                                    >
                                      <UserPlusIcon className="w-4 h-4" />
                                      {promoting === person._id ? 'Promoting...' : 'Promote'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {waitlistData ? 'No events with waitlists found' : 'No waitlist data available'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Registrations Tab */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Total Registrations</h3>
              <p className="text-3xl font-bold text-blue-600">
                {registrationsData?.summary?.totalRegistrations || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Confirmed</h3>
              <p className="text-3xl font-bold text-green-600">
                {registrationsData?.summary?.confirmedRegistrations || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Waitlisted</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {registrationsData?.summary?.waitlistedRegistrations || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Unique People</h3>
              <p className="text-3xl font-bold text-purple-600">
                {registrationsData?.summary?.uniqueAttendees || 0}
              </p>
            </div>
          </div>

          {/* Breakdown Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Event Type */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">By Event Type</h3>
              {registrationsData?.summary?.registrationsByType && (
                <div className="space-y-2">
                  {Object.entries(registrationsData.summary.registrationsByType).map(([type, count]: [string, any]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Major */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">By Major</h3>
              {registrationsData?.summary?.registrationsByMajor && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(registrationsData.summary.registrationsByMajor)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([major, count]: [string, any]) => (
                    <div key={major} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{major}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Grade Level */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">By Grade Level</h3>
              {registrationsData?.summary?.registrationsByGrade && (
                <div className="space-y-2">
                  {Object.entries(registrationsData.summary.registrationsByGrade).map(([grade, count]: [string, any]) => (
                    <div key={grade} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{grade}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All Registrations Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Registrations</h2>
            
            {loadingRegistrations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c]"></div>
                <span className="ml-2 text-gray-600">Loading registrations...</span>
              </div>
            ) : registrationsData && registrationsData.allRegistrations && registrationsData.allRegistrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Major
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrationsData.allRegistrations.map((registration: any) => (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {registration.attendee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registration.attendee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {registration.eventTitle}
                            </div>
                            <div className="text-sm text-gray-500">
                              {registration.eventType}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            registration.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : registration.status === 'waitlisted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {registration.status}
                            {registration.waitlistPosition && ` (#${registration.waitlistPosition})`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registration.attendee.major}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registration.attendee.gradeLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {convertUtcToEst(new Date(registration.registeredAt)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {registrationsData ? 'No registrations found' : 'No registration data available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventForm({ event, onClose, onSave, parentEvent }: any) {
  const { get, post, put } = useAdminApi();
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
    parentEventId: null,
    attendanceConfirmEnabled: false,
    attendancePassword: '',
    waitlistEnabled: false,
    waitlistMaxSize: '',
    waitlistAutoPromote: false,
    requirePassword: false,
    requireName: false,
    requireMajor: false,
    requireGradeLevel: false,
    requirePhone: false,
    roleGatedRegistration: false,
    requiredRoles: []
  });
  const [saving, setSaving] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [customFields, setCustomFields] = useState<Array<{
    id: string;
    type: 'text' | 'select' | 'textarea' | 'email' | 'phone';
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>>([]);
  const [passwordAction, setPasswordAction] = useState<'keep' | 'update' | 'clear' | 'none'>('none');
  const [companies, setCompanies] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);

  // Autosave functionality - works for new events, editing events, and subevents
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        try {
          let draftKey;
          if (event) {
            // Editing existing event
            draftKey = `eventForm_draft_edit_${event.id}`;
          } else {
            // Creating new main event
            draftKey = 'eventForm_draft_new';
          }
          
          const draftData = {
            formData,
            partnerships,
            speakers
          };
          
          localStorage.setItem(draftKey, JSON.stringify(draftData));
        } catch (error) {
          console.error('Error autosaving event form:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSaveData, 5000); // Increased from 1s to 5s
    return () => clearTimeout(timeoutId);
  }, [formData, partnerships, speakers, event, parentEvent]);

  // Load companies, existing partnerships, or draft
  useEffect(() => {
    const loadData = async () => {
      try {
        // Always load companies first
        const companiesData = await get('/api/admin/companies', { skipErrorToast: true });
        if (companiesData) {
          setCompanies(companiesData as Company[]);
        }

        if (event?.id) {
          const partnershipsData = await get(`/api/admin/partnerships/event/${event.id}`, {
            skipErrorToast: true,
          });
          if (partnershipsData) {
            setPartnerships(partnershipsData);
          }
          
          // Check for editing draft
          const editDraftKey = `eventForm_draft_edit_${event.id}`;
          const editDraft = localStorage.getItem(editDraftKey);
          if (editDraft) {
            try {
              const parsedDraft = JSON.parse(editDraft);
              setFormData(parsedDraft.formData);
              setPartnerships(parsedDraft.partnerships || []);
              setSpeakers(parsedDraft.speakers || []);
            } catch (error) {
              console.error('Error loading event editing draft:', error);
              localStorage.removeItem(editDraftKey);
            }
          }
        } else {
          // Load draft for new events
          const draftKey = 'eventForm_draft_new';
          const draft = localStorage.getItem(draftKey);
          if (draft) {
            try {
              const parsedDraft = JSON.parse(draft);
              setFormData(parsedDraft.formData);
              setPartnerships(parsedDraft.partnerships || []);
              setSpeakers(parsedDraft.speakers || []);
            } catch (error) {
              console.error('Error loading event form draft:', error);
              localStorage.removeItem(draftKey);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();

    // Set initial form data for existing event
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventDate: event.eventDate ? formatDateForInput(new Date(event.eventDate)) : '',
        endDate: event.endDate ? formatDateForInput(new Date(event.endDate)) : '',
        location: event.location || '',
        venue: event.venue || '',
        capacity: event.capacity?.toString() || '',
        registrationUrl: event.registrationUrl || '',
        eventType: event.eventType || 'WORKSHOP',
        imageUrl: event.imageUrl || '',
        featured: event.featured || false,
        published: event.published ?? true,
        parentEventId: event.parentEventId || null,
        attendanceConfirmEnabled: event.attendanceConfirmEnabled || false,
        attendancePassword: '', // Never show stored password
        waitlistEnabled: event.waitlistEnabled || false,
        waitlistMaxSize: event.waitlistMaxSize?.toString() || '',
        waitlistAutoPromote: event.waitlistAutoPromote || false,
        requirePassword: event.requirePassword || false,
        requireName: event.requireName || false,
        requireMajor: event.requireMajor || false,
        requireGradeLevel: event.requireGradeLevel || false,
        requirePhone: event.requirePhone || false,
        roleGatedRegistration: !!(event.registration?.enabled && event.registration?.requiredRolesAny?.length > 0),
        requiredRoles: event.registration?.requiredRolesAny || []
      });
      
      // Check if event has existing password
      setHasExistingPassword(!!(event.attendancePasswordHash && event.attendancePasswordSalt));
      setPasswordAction('keep');
      
      // Load speakers if they exist
      if (event.speakers) {
        setSpeakers(event.speakers);
      }
      
      // Load partners if they exist
      if (event.partners) {
        setPartnerships(event.partners.map((partner: any) => ({
          companyId: partner.companyId, // Use companyId, not partner.id
          type: partner.type || 'SPONSOR',
          description: partner.description || '',
          sponsorshipLevel: partner.sponsorshipLevel || partner.tier || ''
        })));
      }
      
      // Load custom fields if they exist
      if (event.customFields) {
        setCustomFields(event.customFields);
      }
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
        parentEventId: parentEvent.id,
        attendanceConfirmEnabled: false,
        attendancePassword: '',
        waitlistEnabled: false,
        waitlistMaxSize: '',
        waitlistAutoPromote: false,
        requirePassword: false,
        requireName: false,
        requireMajor: false,
        requireGradeLevel: false,
        requirePhone: false,
        roleGatedRegistration: false,
        requiredRoles: []
      });
      
      // For new events, set initial password state
      setHasExistingPassword(false);
      setPasswordAction('none'); // Default to no password for new events
    }
  }, [event, parentEvent]);

  const addPartnership = () => {
    setPartnerships([...partnerships, { companyId: '', type: 'SPONSOR', description: '', sponsorshipLevel: '' }]);
  };

  const removePartnership = (index: number) => {
    setPartnerships(partnerships.filter((_: any, i: number) => i !== index));
  };

  const updatePartnership = (index: number, field: string, value: string) => {
    const updated = [...partnerships];
    updated[index][field] = value;
    setPartnerships(updated);
  };

  const addSpeaker = () => {
    const newOrder = Math.max(0, ...speakers.map(s => s.order || 0)) + 1;
    setSpeakers([...speakers, { 
      name: '', 
      title: '', 
      company: '', 
      bio: '', 
      photo: '', 
      linkedIn: '', 
      website: '', 
      order: newOrder
    }]);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_: any, i: number) => i !== index));
  };

  const updateSpeaker = (index: number, field: string, value: string | number) => {
    const updated = [...speakers];
    updated[index][field] = value;
    setSpeakers(updated);
  };

  const moveSpeaker = (fromIndex: number, toIndex: number) => {
    const updated = [...speakers];
    const [movedSpeaker] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedSpeaker);
    
    // Update order values to match new positions
    updated.forEach((speaker, index) => {
      speaker.order = index + 1;
    });
    
    setSpeakers(updated);
  };

  const moveSpeakerUp = (index: number) => {
    if (index > 0) {
      moveSpeaker(index, index - 1);
    }
  };

  const moveSpeakerDown = (index: number) => {
    if (index < speakers.length - 1) {
      moveSpeaker(index, index + 1);
    }
  };

  // Custom field management functions
  const addCustomField = () => {
    setCustomFields([...customFields, {
      id: Date.now().toString(),
      type: 'text',
      label: '',
      required: false,
      placeholder: ''
    }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: string, value: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: value };
    setCustomFields(updated);
  };

  const addCustomFieldOption = (fieldIndex: number) => {
    const updated = [...customFields];
    if (!updated[fieldIndex].options) {
      updated[fieldIndex].options = [];
    }
    updated[fieldIndex].options!.push('');
    setCustomFields(updated);
  };

  const removeCustomFieldOption = (fieldIndex: number, optionIndex: number) => {
    const updated = [...customFields];
    updated[fieldIndex].options = updated[fieldIndex].options?.filter((_, i) => i !== optionIndex);
    setCustomFields(updated);
  };

  const updateCustomFieldOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const updated = [...customFields];
    if (updated[fieldIndex].options) {
      updated[fieldIndex].options[optionIndex] = value;
    }
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Handle password actions
      let passwordUpdate = {};
      if (passwordAction === 'update' && formData.attendancePassword.trim()) {
        passwordUpdate = { attendancePassword: formData.attendancePassword };
      } else if (passwordAction === 'clear' || passwordAction === 'none') {
        passwordUpdate = { attendancePassword: null }; // Signal to clear password or set no password
      }
      
      const basePayload = {
        ...formData,
        eventDate: formData.eventDate ? parseDateFromInput(formData.eventDate).toISOString() : null,
        endDate: formData.endDate ? parseDateFromInput(formData.endDate).toISOString() : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        waitlistMaxSize: formData.waitlistMaxSize ? parseInt(formData.waitlistMaxSize) : null,
        speakers: speakers.filter(s => s.name && s.title && s.company),
        partners: partnerships.filter(p => p.companyId),
        customFields: customFields.filter(f => f.label.trim()),
        registration: formData.roleGatedRegistration && formData.requiredRoles.length > 0 ? {
          enabled: true,
          requiredRolesAny: formData.requiredRoles
        } : { enabled: false }
      };
      
      // Create final payload - only include password updates if we're not keeping existing
      const payload = passwordAction === 'keep' ? 
        { ...basePayload, attendancePassword: undefined } : 
        { ...basePayload, ...passwordUpdate };

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

      const eventData =
        method === 'PUT'
          ? await put(url, payload, { parseAs: 'json', skipErrorToast: true })
          : await post(url, payload, { parseAs: 'json', skipErrorToast: true });

      const eventId = (eventData as { id?: string })?.id || event?.id;

      // Save partnerships if any exist
      if (partnerships.length > 0 && eventId) {
        await post(
          '/api/admin/partnerships/event',
          {
            eventId,
            partnerships: partnerships.filter((p) => p.companyId),
          },
          { skipErrorToast: true }
        );
      }

      const draftKey = event ? `eventForm_draft_edit_${event.id}` : 'eventForm_draft_new';
      localStorage.removeItem(draftKey);
      toast.success(`Event ${event ? 'updated' : 'created'}`);
      onSave();
    } catch (error) {
      toast.error('Error saving event');
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
            ✓ Auto-saving
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
                <option key="WORKSHOP" value="WORKSHOP">Workshop</option>
                <option key="SYMPOSIUM" value="SYMPOSIUM">Symposium</option>
                <option key="NETWORKING" value="NETWORKING">Networking</option>
                <option key="CONFERENCE" value="CONFERENCE">Conference</option>
                <option key="MEETING" value="MEETING">Meeting</option>
                <option key="SOCIAL" value="SOCIAL">Social</option>
                <option key="RECRUITMENT" value="RECRUITMENT">Recruitment</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date & Time * (EST)</label>
              <input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time (EST)</label>
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

          {/* Attendance Confirmation Section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-4">Attendance Confirmation</h4>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="attendanceConfirmEnabled"
                  checked={formData.attendanceConfirmEnabled}
                  onChange={(e) => setFormData({...formData, attendanceConfirmEnabled: e.target.checked})}
                  className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                />
                <label htmlFor="attendanceConfirmEnabled" className="ml-2 text-sm text-gray-700">
                  Enable attendance confirmation for this event
                </label>
              </div>
              
              {formData.attendanceConfirmEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Password Management
                    </label>
                    
                    {hasExistingPassword && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Password is currently set for this event
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">What would you like to do?</label>
                        <div className="mt-2 space-y-2">
                          {hasExistingPassword && (
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="passwordAction"
                                value="keep"
                                checked={passwordAction === 'keep'}
                                onChange={(e) => setPasswordAction(e.target.value as any)}
                                className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Keep existing password</span>
                            </label>
                          )}
                          
                          {!hasExistingPassword && (
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="passwordAction"
                                value="none"
                                checked={passwordAction === 'none'}
                                onChange={(e) => setPasswordAction(e.target.value as any)}
                                className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No password required</span>
                            </label>
                          )}
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="passwordAction"
                              value="update"
                              checked={passwordAction === 'update'}
                              onChange={(e) => setPasswordAction(e.target.value as any)}
                              className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {hasExistingPassword ? 'Update password' : 'Set password'}
                            </span>
                          </label>
                          
                          {hasExistingPassword && (
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="passwordAction"
                                value="clear"
                                checked={passwordAction === 'clear'}
                                onChange={(e) => setPasswordAction(e.target.value as any)}
                                className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Remove password (no password required)</span>
                            </label>
                          )}
                        </div>
                      </div>
                      
                      {passwordAction === 'update' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {hasExistingPassword ? 'New Password' : 'Event Password'}
                          </label>
                          <input
                            type="password"
                            value={formData.attendancePassword}
                            onChange={(e) => setFormData({...formData, attendancePassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            placeholder={hasExistingPassword ? "Enter new password..." : "Set event password..."}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Students will need this password to confirm their attendance
                          </p>
                        </div>
                      )}
                      
                      {passwordAction === 'clear' && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            The password will be removed. Students will be able to confirm attendance without entering a password.
                          </p>
                        </div>
                      )}
                      
                      {passwordAction === 'none' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            No password will be set. Students will be able to confirm attendance without entering a password.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Required Information</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requireName"
                          checked={formData.requireName}
                          onChange={(e) => setFormData({...formData, requireName: e.target.checked})}
                          className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                        />
                        <label htmlFor="requireName" className="ml-2 text-sm text-gray-600">
                          Require full name
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requireMajor"
                          checked={formData.requireMajor}
                          onChange={(e) => setFormData({...formData, requireMajor: e.target.checked})}
                          className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                        />
                        <label htmlFor="requireMajor" className="ml-2 text-sm text-gray-600">
                          Require major
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requireGradeLevel"
                          checked={formData.requireGradeLevel}
                          onChange={(e) => setFormData({...formData, requireGradeLevel: e.target.checked})}
                          className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                        />
                        <label htmlFor="requireGradeLevel" className="ml-2 text-sm text-gray-600">
                          Require grade level
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requirePhone"
                          checked={formData.requirePhone}
                          onChange={(e) => setFormData({...formData, requirePhone: e.target.checked})}
                          className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                        />
                        <label htmlFor="requirePhone" className="ml-2 text-sm text-gray-600">
                          Require phone number
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      UMich email is always required for attendance confirmation
                    </p>
                  </div>
                  
                  {/* Role-Based Registration Section */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Registration Access Control</h5>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="roleGatedRegistration"
                          checked={formData.roleGatedRegistration}
                          onChange={(e) => setFormData({...formData, roleGatedRegistration: e.target.checked})}
                          className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                        />
                        <label htmlFor="roleGatedRegistration" className="ml-2 text-sm text-gray-700">
                          Restrict registration to specific member roles
                        </label>
                      </div>
                      
                      {formData.roleGatedRegistration && (
                        <div className="ml-6 space-y-2">
                          <p className="text-sm text-gray-600 mb-3">
                            Select which member roles can register for this event:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {USER_ROLES.map(role => (
                              <div key={role} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`role-${role}`}
                                  checked={formData.requiredRoles.includes(role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        requiredRoles: [...formData.requiredRoles, role]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        requiredRoles: formData.requiredRoles.filter(r => r !== role)
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                                />
                                <label htmlFor={`role-${role}`} className="ml-2 text-sm text-gray-600">
                                  {getRoleDisplayName(role)}
                                </label>
                              </div>
                            ))}
                          </div>
                          {formData.requiredRoles.length === 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                              Please select at least one role to enable role-gated registration
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Fields Section */}
          {formData.attendanceConfirmEnabled && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Custom Registration Fields</h4>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Custom Field
                </button>
              </div>
              
              <p className="text-xs text-gray-600 mb-4">
                Add custom questions to collect additional information during registration
              </p>
              
              {customFields.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-lg">
                  No custom fields added yet. Click "Add Custom Field" to create registration questions.
                </div>
              ) : (
                <div className="space-y-4">
                  {customFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Label *
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            placeholder="e.g., Dietary Restrictions"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                          >
                            <option value="text">Text Input</option>
                            <option value="textarea">Text Area</option>
                            <option value="select">Dropdown/Select</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone Number</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Placeholder Text
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateCustomField(index, 'placeholder', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            placeholder="Optional placeholder text"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                            className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                          />
                          <label htmlFor={`required-${field.id}`} className="ml-2 text-sm text-gray-700">
                            Required field
                          </label>
                        </div>
                      </div>
                      
                      {field.type === 'select' && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Dropdown Options
                            </label>
                            <button
                              type="button"
                              onClick={() => addCustomFieldOption(index)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Add Option
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(field.options || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateCustomFieldOption(index, optionIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomFieldOption(index, optionIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {(!field.options || field.options.length === 0) && (
                              <div className="text-sm text-gray-500 py-2 text-center border border-dashed border-gray-300 rounded">
                                No options added yet. Click "Add Option" to create choices.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Waitlist Settings Section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-4">Waitlist Settings</h4>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="waitlistEnabled"
                  checked={formData.waitlistEnabled}
                  onChange={(e) => setFormData({...formData, waitlistEnabled: e.target.checked})}
                  className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                />
                <label htmlFor="waitlistEnabled" className="ml-2 text-sm text-gray-700">
                  Enable waitlist when capacity is reached
                </label>
              </div>
              
              {formData.waitlistEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Waitlist Size
                      <span className="text-xs text-gray-500 ml-2">(optional - leave blank for unlimited)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.waitlistMaxSize}
                      onChange={(e) => setFormData({...formData, waitlistMaxSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                      placeholder="e.g. 50"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="waitlistAutoPromote"
                      checked={formData.waitlistAutoPromote}
                      onChange={(e) => setFormData({...formData, waitlistAutoPromote: e.target.checked})}
                      className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                    />
                    <label htmlFor="waitlistAutoPromote" className="ml-2 text-sm text-gray-700">
                      Automatically promote from waitlist when spots become available
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requirePassword"
                  checked={formData.requirePassword}
                  onChange={(e) => setFormData({...formData, requirePassword: e.target.checked})}
                  className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                />
                <label htmlFor="requirePassword" className="ml-2 text-sm text-gray-700">
                  Require password for event registration
                </label>
              </div>
            </div>
          </div>

          {/* Company Partnerships Section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Company Partnerships</h4>
              <button
                type="button"
                onClick={addPartnership}
                className="px-3 py-1 bg-[#00274c] text-white rounded-md hover:bg-[#003366] text-sm admin-white-text"
              >
                Add Partnership
              </button>
            </div>
            
            {partnerships.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No partnerships added yet</p>
            ) : (
              <div className="space-y-3">
                {partnerships.map((partnership: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <select
                          value={partnership.companyId}
                          onChange={(e) => updatePartnership(index, 'companyId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                          required
                        >
                          <option key="empty" value="">Select a company</option>
                          {companies.map((company: any, index: number) => (
                            <option key={company.id || `company-${index}`} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Type</label>
                        <select
                          value={partnership.type}
                          onChange={(e) => updatePartnership(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        >
                          <option key="SPONSOR" value="SPONSOR">Sponsor</option>
                          <option key="COLLABORATOR" value="COLLABORATOR">Collaborator</option>
                          <option key="MENTOR" value="MENTOR">Mentor</option>
                          <option key="ADVISOR" value="ADVISOR">Advisor</option>
                          <option key="VENDOR" value="VENDOR">Vendor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Level</label>
                        <select
                          value={partnership.sponsorshipLevel}
                          onChange={(e) => updatePartnership(index, 'sponsorshipLevel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        >
                          <option key="empty-level" value="">Select Level</option>
                          <option key="Platinum" value="Platinum">Platinum</option>
                          <option key="Gold" value="Gold">Gold</option>
                          <option key="Silver" value="Silver">Silver</option>
                          <option key="Bronze" value="Bronze">Bronze</option>
                          <option key="Supporting" value="Supporting">Supporting</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removePartnership(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={partnership.description}
                        onChange={(e) => updatePartnership(index, 'description', e.target.value)}
                        placeholder="Describe the partnership..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Speakers Section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Event Speakers</h4>
              <button
                type="button"
                onClick={addSpeaker}
                className="px-3 py-1 bg-[#00274c] text-white rounded-md hover:bg-[#003366] text-sm admin-white-text"
              >
                Add Speaker
              </button>
            </div>
            
            {speakers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No speakers added yet</p>
            ) : (
              <div className="space-y-4">
                {speakers
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((speaker: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded border space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Speaker #{index + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSpeakerUp(index)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSpeakerDown(index)}
                            disabled={index === speakers.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpeaker(index)}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                          placeholder="Speaker full name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={speaker.title}
                          onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                          placeholder="Job title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          min="1"
                          value={speaker.order || index + 1}
                          onChange={(e) => {
                            const newOrder = parseInt(e.target.value) || index + 1;
                            updateSpeaker(index, 'order', newOrder);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                        <input
                          type="text"
                          value={speaker.company}
                          onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                          placeholder="Company name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                        <input
                          type="url"
                          value={speaker.photo}
                          onChange={(e) => updateSpeaker(index, 'photo', e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={speaker.bio}
                        onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                        rows={2}
                        placeholder="Brief speaker biography..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <input
                          type="url"
                          value={speaker.linkedIn}
                          onChange={(e) => updateSpeaker(index, 'linkedIn', e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                        <input
                          type="url"
                          value={speaker.website}
                          onChange={(e) => updateSpeaker(index, 'website', e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            className="admin-save-btn px-4 py-2 bg-[#00274c] text-white hover:bg-[#003366] hover:text-white rounded-lg disabled:opacity-50 disabled:text-white font-medium admin-white-text"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Attendance Info Component
function AttendanceInfo({ eventId }: { eventId: string }) {
  const { get, request } = useAdminApi();
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadAttendanceData();
  }, [eventId]);

  const loadAttendanceData = async () => {
    try {
      const data = await get(`/api/admin/events/${eventId}/attendance`, { skipErrorToast: true });
      if (data) {
        setAttendanceData(data);
      }
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await request<Response>(`/api/admin/events/${eventId}/attendance?format=csv`, {
        parseAs: 'response',
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `event-${eventId}-attendance.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download attendance list');
    }
  };

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-700">Loading attendance...</span>
        </div>
      </div>
    );
  }

  if (!attendanceData) return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              {attendanceData.attendees.length} Attendee{attendanceData.attendees.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-green-900">
              {attendanceData.uniqueUsers} Unique User{attendanceData.uniqueUsers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {attendanceData.attendees.length > 0 && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
              <button
                onClick={downloadCSV}
                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </>
          )}
        </div>
      </div>
      
      {showDetails && attendanceData.attendees.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-3">
              {attendanceData.attendees.map((attendee: any, index: number) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 font-medium">{attendee.userName}</span>
                      <span className="text-xs text-gray-500">{attendee.email}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {convertUtcToEst(new Date(attendee.confirmedAt)).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} at{' '}
                      {convertUtcToEst(new Date(attendee.confirmedAt)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} EST
                    </span>
                  </div>
                  
                  {/* Standard Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    {attendee.attendee?.major && (
                      <div className="text-xs">
                        <span className="font-medium text-gray-600">Major:</span> {attendee.attendee.major}
                      </div>
                    )}
                    {attendee.attendee?.gradeLevel && (
                      <div className="text-xs">
                        <span className="font-medium text-gray-600">Grade:</span> {attendee.attendee.gradeLevel}
                      </div>
                    )}
                    {attendee.attendee?.phone && (
                      <div className="text-xs">
                        <span className="font-medium text-gray-600">Phone:</span> {attendee.attendee.phone}
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Fields */}
                  {attendanceData.customFields && attendanceData.customFields.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {attendanceData.customFields.map((field: any) => {
                          const response = attendee.customFieldResponses?.[field.id];
                          if (!response) return null;
                          
                          return (
                            <div key={field.id} className="text-xs">
                              <span className="font-medium text-gray-600">{field.label}:</span>{' '}
                              <span className="text-gray-800">{response}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
