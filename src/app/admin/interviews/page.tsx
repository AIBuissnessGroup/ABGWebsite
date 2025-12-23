'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ClockIcon, MapPinIcon, UserIcon, EnvelopeIcon, ArrowTopRightOnSquareIcon, TrashIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { isAdmin } from '@/lib/admin';

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
  title?: string;
  description?: string;
  bookedByUserId?: string;
  signup?: InterviewSignup;
};

type ApplicationData = {
  submissionId: string;
  submittedAt: string;
  applicantName: string;
  applicantEmail: string;
  responses: Array<{
    questionId: string;
    textValue?: string;
    numberValue?: number;
    booleanValue?: boolean;
    dateValue?: string;
    selectedOptions?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileData?: string;
  }>;
  formTitle: string;
  questions: Array<{
    id: string;
    title: string;
    type: string;
    required: boolean;
  }>;
};

export default function AdminInterviewsPage() {
  const { data: session, status } = useSession();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [applicationLoading, setApplicationLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!isAdmin(session?.user)) {
      window.location.href = '/';
      return;
    }

    loadSlots();
    loadWhitelist();
  }, [session, status]);

  const loadWhitelist = async () => {
    try {
      const response = await fetch('/api/admin/interviews/whitelist');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load whitelist');
      }
      
      setWhitelist(data);
    } catch (error) {
      console.error('Error loading whitelist:', error);
    }
  };

  const loadSlots = async () => {
    try {
      setLoading(true);
      // Load all available interview slots
      const response = await fetch('/api/admin/interviews/slots');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load slots');
      }
      
      setSlots(data);
    } catch (error) {
      console.error('Error loading slots:', error);
      setMessage('Failed to load interview slots');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };



  const formatTime = (timeString: string) => {
    // Handle time-only strings like "09:00" or "14:30"
    if (timeString && timeString.includes(':') && !timeString.includes('T')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours, 10);
      const min = parseInt(minutes, 10);
      
      // Convert to 12-hour format
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      const minStr = min.toString().padStart(2, '0');
      
      return `${hour12}:${minStr} ${ampm}`;
    }
    
    // Fallback for full datetime strings
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York' // Use America/New_York for consistency
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const cancelBooking = async (slotId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    setActionLoading(slotId);
    try {
      const response = await fetch(`/api/admin/interviews/slots/${slotId}/cancel`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      setMessage('Successfully cancelled booking');
      setMessageType('success');
      await loadSlots();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to cancel booking');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };



  const exportCSV = () => {
    const csvContent = [
      ['Room', 'Start Time', 'End Time', 'Status', 'Student Name', 'Email', 'Uniqname', 'Booked At'].join(','),
      ...slots.map(slot => [
        slot.room,
        formatTime(slot.startTime),
        formatTime(slot.endTime),
        slot.status,
        slot.signup?.userName || '',
        slot.signup?.userEmail || '',
        slot.signup?.uniqname || '',
        slot.signup?.createdAt ? formatDateTime(slot.signup.createdAt) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviews-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addToWhitelist = async () => {
    if (!newEmail.trim()) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    setActionLoading('whitelist-add');
    try {
      const response = await fetch('/api/admin/interviews/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add email');
      }
      
      setMessage(`Successfully added ${newEmail} to whitelist`);
      setMessageType('success');
      setNewEmail('');
      setShowWhitelistModal(false);
      await loadWhitelist();
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to add email');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const removeFromWhitelist = async (entryId: string, email: string) => {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    
    setActionLoading(`whitelist-remove-${entryId}`);
    try {
      const response = await fetch(`/api/admin/interviews/whitelist?id=${entryId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove email');
      }
      
      setMessage(`Successfully removed ${email} from whitelist`);
      setMessageType('success');
      await loadWhitelist();
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to remove email');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const viewApplication = async (email: string) => {
    setApplicationLoading(true);
    try {
      const response = await fetch(`/api/admin/interviews/application/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setMessage('No application found for this student');
        } else {
          setMessage(data.error || 'Failed to load application');
        }
        setMessageType('error');
        return;
      }

      setSelectedApplication(data);
      setShowApplicationModal(true);
    } catch (error) {
      console.error('Error loading application:', error);
      setMessage('Failed to load application');
      setMessageType('error');
    } finally {
      setApplicationLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAdmin(session?.user)) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Access Denied</h1>
          <p className="text-white">You don't have permission to access the admin dashboard.</p>
          <p className="text-white mt-2">
            Signed in as: <br />
            <strong>{session?.user?.email}</strong>
          </p>
          <p className="text-white mt-2">
            Roles: {session?.user?.roles ? session.user.roles.join(', ') : 'None'}
          </p>
          <p className="text-white mt-2">
            Only authorized University of Michigan users can access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  const bookedSlots = slots.filter(slot => slot.status === 'booked');
  const availableSlots = slots.filter(slot => slot.status === 'available');

  return (
    <div className="min-h-screen bg-[#00274c] text-white" style={{ color: 'white', backgroundColor: '#00274c' }}>
      <div className="container mx-auto px-4 py-8" style={{ color: 'white' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div style={{ color: 'white' }}>
            <h1 className="text-4xl font-bold mb-2 text-white" style={{ color: 'white !important' }}>Admin: Interviews</h1>
            <p className="text-white" style={{ color: 'white !important' }}>Interview Slots</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Manage Whitelist
            </button>
          </div>
        </div>

        {/* Google Sheet Banner */}
        <div className="mb-6 bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-white" style={{ color: 'white !important' }}>
              For roster by slot, see the tracking sheet
            </p>
            <a
              href="https://docs.google.com/spreadsheets/d/1yTfnXxGizPVz2chlYmZ8bKlRkq9KEAuC0y5PqB4CENk/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              Open Sheet
            </a>
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 rounded-lg p-6 text-center" style={{ color: 'white' }}>
            <div className="text-3xl font-bold text-blue-400">{slots.length}</div>
            <div className="text-white" style={{ color: 'white !important' }}>Total Slots</div>
          </div>
          <div className="bg-white/10 rounded-lg p-6 text-center" style={{ color: 'white' }}>
            <div className="text-3xl font-bold text-green-400">{bookedSlots.length}</div>
            <div className="text-white" style={{ color: 'white !important' }}>Booked</div>
          </div>
          <div className="bg-white/10 rounded-lg p-6 text-center" style={{ color: 'white' }}>
            <div className="text-3xl font-bold text-yellow-400">{availableSlots.length}</div>
            <div className="text-white" style={{ color: 'white !important' }}>Available</div>
          </div>
        </div>

        {/* Approved Students Whitelist */}
        <div className="mb-8 bg-white/10 rounded-lg p-6" style={{ color: 'white' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white" style={{ color: 'white !important' }}>Approved Students ({whitelist.length})</h2>
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Email
            </button>
          </div>
          
          {whitelist.length === 0 ? (
            <p className="text-white text-center py-4" style={{ color: 'white !important' }}>
              No approved emails yet. Add student emails to allow interview signups.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {whitelist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div>
                    <div className="font-medium text-white">{entry.email}</div>
                    <div className="text-sm text-gray-300">
                      Added {formatDateTime(entry.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWhitelist(entry.id, entry.email)}
                    disabled={actionLoading === `whitelist-remove-${entry.id}`}
                    className="text-red-400 hover:text-red-300 p-1 rounded transition-colors disabled:opacity-50"
                    title="Remove from whitelist"
                  >
                    {actionLoading === `whitelist-remove-${entry.id}` ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slots Table */}
        {slots.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'white' }}>
            <p className="text-xl text-white mb-4" style={{ color: 'white !important' }}>No interview slots found</p>
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ color: 'white' }}>
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Room</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Start</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>End</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Status</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Student Name</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Email</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Uniqname</th>
                    <th className="text-left p-4 font-semibold text-white" style={{ color: 'white !important' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots
                    .sort((a, b) => {
                      // Sort by room first, then by start time
                      if (a.room !== b.room) {
                        return a.room.localeCompare(b.room);
                      }
                      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                    })
                    .map((slot) => (
                    <tr key={slot.id} className="border-t border-white/10" style={{ color: 'white' }}>
                      <td className="p-4 text-white" style={{ color: 'white !important' }}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            {slot.room}
                          </div>
                          {slot.title && (
                            <div className="text-xs text-blue-300">
                              {slot.title}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-white" style={{ color: 'white !important' }}>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          {formatTime(slot.startTime)}
                        </div>
                      </td>
                      <td className="p-4 text-white" style={{ color: 'white !important' }}>{formatTime(slot.endTime)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slot.status === 'booked' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="p-4 text-white" style={{ color: 'white !important' }}>
                        {slot.signup ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            {slot.signup.userName || slot.signup.userEmail.split('@')[0]}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-white" style={{ color: 'white !important' }}>
                        {slot.signup ? (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" />
                            {slot.signup.userEmail}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-white" style={{ color: 'white !important' }}>
                        {slot.signup ? (
                          <span className="font-mono text-sm text-white" style={{ color: 'white !important' }}>{slot.signup.uniqname}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {slot.status === 'booked' && (
                            <>
                              <button
                                onClick={() => viewApplication(slot.signup!.userEmail)}
                                disabled={applicationLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                                title="View Application"
                              >
                                {applicationLoading ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <DocumentTextIcon className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => cancelBooking(slot.id)}
                                disabled={actionLoading === slot.id}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                                title="Cancel booking"
                              >
                                {actionLoading === slot.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <TrashIcon className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* Whitelist Management Modal */}
        {showWhitelistModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#001a35] border border-white/20 rounded-lg p-6 max-w-md w-full mx-4" style={{ color: 'white' }}>
              <h2 className="text-xl font-bold mb-4 text-white" style={{ color: 'white !important' }}>Add Email to Whitelist</h2>
              <p className="text-white mb-4" style={{ color: 'white !important' }}>
                Only students with approved emails can sign up for interviews.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2" style={{ color: 'white !important' }}>
                  Student Email (@umich.edu)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@umich.edu"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToWhitelist();
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={addToWhitelist}
                  disabled={actionLoading === 'whitelist-add' || !newEmail.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'whitelist-add' ? 'Adding...' : 'Add Email'}
                </button>
                <button
                  onClick={() => {
                    setShowWhitelistModal(false);
                    setNewEmail('');
                  }}
                  disabled={actionLoading === 'whitelist-add'}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#001a35] border border-white/20 rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col" style={{ color: 'white' }}>
              <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ color: 'white !important' }}>
                    {selectedApplication.formTitle}
                  </h2>
                  <div className="text-sm text-gray-300 mt-1">
                    <p><strong>Applicant:</strong> {selectedApplication.applicantName} ({selectedApplication.applicantEmail})</p>
                    <p><strong>Submitted:</strong> {new Date(selectedApplication.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedApplication(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {selectedApplication.questions
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((question) => {
                    const response = selectedApplication.responses.find((r: any) => r.questionId === question.id);
                    
                    return (
                      <div key={question.id} className="border-b border-white/10 pb-6 last:border-b-0">
                        <h3 className="font-semibold text-white mb-3" style={{ color: 'white !important' }}>
                          {question.title}
                          {question.required && <span className="text-red-400 ml-1">*</span>}
                          <span className="text-xs text-gray-400 ml-2 font-normal">({question.type})</span>
                        </h3>
                        <div className="bg-white/5 rounded-lg p-3">
                          {response ? (
                            <div className="text-white" style={{ color: 'white !important' }}>
                              {response.textValue ? (
                                <div className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded p-3">
                                  <p className="whitespace-pre-wrap break-words">{response.textValue}</p>
                                </div>
                              ) : response.numberValue !== undefined ? (
                                <p>{response.numberValue}</p>
                              ) : response.booleanValue !== undefined ? (
                                <p>{response.booleanValue ? 'Yes' : 'No'}</p>
                              ) : response.dateValue ? (
                                <p>{new Date(response.dateValue).toLocaleDateString()}</p>
                              ) : response.selectedOptions ? (
                                <div className="flex flex-wrap gap-1">
                                  {JSON.parse(response.selectedOptions).map((option: string, index: number) => (
                                    <span key={index} className="inline-block bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-sm">
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              ) : response.fileName ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded">
                                    <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                                    <div className="flex-1">
                                      <p className="font-medium">{response.fileName}</p>
                                      <p className="text-sm text-gray-300">
                                        {response.fileType} • {response.fileSize ? `${Math.round(response.fileSize / 1024)} KB` : 'Unknown size'}
                                      </p>
                                    </div>
                                  </div>
                                  {response.fileData && (
                                    <div className="space-y-2">
                                      {response.fileType?.startsWith('image/') ? (
                                        <div className="max-w-sm">
                                          <img 
                                            src={response.fileData.startsWith('data:') ? response.fileData : `data:${response.fileType};base64,${response.fileData}`}
                                            alt={response.fileName}
                                            className="max-w-full h-auto rounded border border-white/20"
                                            onError={(e) => {
                                              console.error('Image failed to load:', {
                                                fileName: response.fileName,
                                                fileType: response.fileType,
                                                hasFileData: !!response.fileData,
                                                fileDataLength: response.fileData?.length,
                                                fileDataPreview: response.fileData?.substring(0, 50)
                                              });
                                              e.currentTarget.style.display = 'none';
                                              const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                              if (errorDiv) errorDiv.style.display = 'block';
                                            }}
                                          />
                                          <div className="hidden bg-red-500/20 border border-red-400/30 rounded p-3 text-red-200">
                                            <p className="text-sm">Failed to load image. The file data may be corrupted or in an unsupported format.</p>
                                            <button
                                              onClick={() => {
                                                if (response.fileData) {
                                                  const link = document.createElement('a');
                                                  link.href = response.fileData.startsWith('data:') ? response.fileData : `data:${response.fileType};base64,${response.fileData}`;
                                                  link.download = response.fileName || 'image';
                                                  link.click();
                                                }
                                              }}
                                              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                            >
                                              Try Download
                                            </button>
                                          </div>
                                        </div>
                                      ) : response.fileType === 'application/pdf' ? (
                                        <div className="bg-white/5 border border-white/10 rounded p-3">
                                          <p className="text-sm text-gray-300 mb-2">PDF Preview:</p>
                                          <iframe
                                            src={`data:application/pdf;base64,${response.fileData}`}
                                            className="w-full h-64 border border-white/20 rounded"
                                            title={response.fileName}
                                          />
                                        </div>
                                      ) : response.fileType?.startsWith('text/') ? (
                                        <div className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded p-3">
                                          <pre className="whitespace-pre-wrap text-sm">
                                            {atob(response.fileData)}
                                          </pre>
                                        </div>
                                      ) : (
                                        <div className="bg-white/5 border border-white/10 rounded p-3">
                                          <p className="text-sm text-gray-300">
                                            File preview not available for {response.fileType}
                                          </p>
                                          <button
                                            onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = response.fileData.startsWith('data:') ? response.fileData : `data:${response.fileType};base64,${response.fileData}`;
                                              link.download = response.fileName || 'download';
                                              link.click();
                                            }}
                                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                          >
                                            Download File
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {!response.fileData && (
                                    <div className="bg-yellow-500/20 border border-yellow-400/30 rounded p-3 text-yellow-200">
                                      <p className="text-sm">File uploaded but content not available for preview.</p>
                                      <p className="text-xs text-yellow-300 mt-1">
                                        Debug Info:
                                        <br />• Has fileData: {!!response.fileData}
                                        <br />• fileName: {response.fileName}
                                        <br />• fileType: {response.fileType}
                                        <br />• fileSize: {response.fileSize}
                                        {response.fileData && (
                                          <>
                                            <br />• fileData length: {response.fileData.length}
                                            <br />• fileData start: {response.fileData.substring(0, 50)}...
                                            <br />• Is base64: {response.fileData.startsWith('data:')}
                                          </>
                                        )}
                                        <br />• Full response keys: {Object.keys(response).join(', ')}
                                      </p>
                                      {response.fileData && (
                                        <button
                                          onClick={() => {
                                            try {
                                              const base64Data = response.fileData.startsWith('data:') 
                                                ? response.fileData 
                                                : `data:${response.fileType || 'application/octet-stream'};base64,${response.fileData}`;
                                              const link = document.createElement('a');
                                              link.href = base64Data;
                                              link.download = response.fileName || 'file';
                                              link.click();
                                            } catch (error) {
                                              console.error('Download failed:', error);
                                              alert('Failed to download file');
                                            }
                                          }}
                                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                        >
                                          Try Download Raw File
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p>Unknown response type</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">No response provided</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t border-white/20 bg-white/5">
                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedApplication(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}