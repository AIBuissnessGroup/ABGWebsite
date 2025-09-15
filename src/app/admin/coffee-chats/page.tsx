'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, UserIcon, EnvelopeIcon, UsersIcon, EyeIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import CoffeeChatBulkCreateModal from '@/components/admin/CoffeeChatBulkCreateModal';
import CoffeeChatSpreadsheet from '@/components/admin/CoffeeChatSpreadsheet';

type Signup = {
  id: string;
  userEmail: string;
  userName: string | null;
  phone?: string;
  createdAt: string;
};

type Slot = {
  id?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  hostName?: string;
  hostEmail?: string;
  capacity?: number;
  isOpen?: boolean;
  execMember?: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  execMemberId?: string;
  signups?: Signup[];
  signupCount?: number;
};

export default function AdminCoffeeChatsPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignups, setShowSignups] = useState<string | null>(null);
  const [removingSignup, setRemovingSignup] = useState<string | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [filterHost, setFilterHost] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recruitment/coffee-chats');
      const data = await res.json();
      setSlots(data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  useEffect(() => { 
    load(); 
    loadTeamMembers();
  }, []);

  const save = async () => {
    if (!editing) return;
    
    const errors = [];
    if (!editing.title?.trim()) errors.push('Title is required');
    if (!editing.startTime) errors.push('Start Time is required');
    if (!editing.endTime) errors.push('End Time is required');
    if (!editing.location?.trim()) errors.push('Location is required');
    if (!editing.hostName?.trim()) errors.push('Host Name is required');
    if (!editing.hostEmail?.trim()) errors.push('Host Email is required');
    if (!editing.capacity || editing.capacity < 1) errors.push('Capacity must be at least 1');
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return;
    }

    const method = editing.id ? 'PUT' : 'POST';
    await fetch('/api/admin/recruitment/coffee-chats', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setEditing(null);
    await load();
  };

  const remove = async (id?: string) => {
    if (!id) return;
    await fetch(`/api/admin/recruitment/coffee-chats?id=${id}`, { method: 'DELETE' });
    await load();
  };

  const assignExec = async (slotId: string, execMemberId: string) => {
    try {
      const execMember = teamMembers.find(m => m.id === execMemberId);
      if (!execMember) return;

      const response = await fetch(`/api/admin/coffee-chats/${slotId}/assign-exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          execMemberId,
          execName: execMember.name,
          execEmail: execMember.email,
        }),
      });

      if (response.ok) {
        await load();
      }
    } catch (error) {
      console.error('Error assigning exec:', error);
    }
  };

  const removeSignup = async (slotId: string, signupId: string) => {
    setRemovingSignup(signupId);
    try {
      const res = await fetch('/api/admin/recruitment/coffee-chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeSignup',
          slotId,
          signupId,
        }),
      });

      if (res.ok) {
        const updatedSlot = await res.json();
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot.id === slotId ? updatedSlot : slot
          )
        );
      }
    } catch (error) {
      console.error('Error removing signup:', error);
    } finally {
      setRemovingSignup(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatSignupDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter function
  const filteredSlots = slots.filter(slot => {
    // Text filter (title, location, host name, signups)
    const textMatch = filterText === '' || 
      slot.title?.toLowerCase().includes(filterText.toLowerCase()) ||
      slot.location?.toLowerCase().includes(filterText.toLowerCase()) ||
      slot.hostName?.toLowerCase().includes(filterText.toLowerCase()) ||
      slot.execMember?.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      slot.signups?.some(signup => 
        signup.userName?.toLowerCase().includes(filterText.toLowerCase()) ||
        signup.userEmail?.toLowerCase().includes(filterText.toLowerCase())
      );

    // Status filter - check if slot has available spots
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'open' && ((slot.signupCount || 0) < (slot.capacity || 1))) ||
      (filterStatus === 'closed' && ((slot.signupCount || 0) >= (slot.capacity || 1)));

    // Host filter
    const hostMatch = filterHost === 'all' || 
      slot.execMember?.id === filterHost ||
      slot.hostEmail === filterHost;

    return textMatch && statusMatch && hostMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coffee Chat Slots</h1>
          <p className="text-gray-600 mt-1">Manage coffee chat scheduling and availability</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#00274c] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === 'spreadsheet'
                  ? 'bg-[#00274c] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Spreadsheet View
            </button>
          </div>
          
          <button
            onClick={() => setShowBulkCreate(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CalendarDaysIcon className="w-4 h-4" />
            Bulk Create Slots
          </button>
          
          <button 
            onClick={() => setEditing({ 
              title: 'Coffee Chat', 
              startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
              endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString().slice(0, 16),
              location: 'Ross School of Business',
              hostName: '',
              hostEmail: '',
              capacity: 1,
              isOpen: true
            })} 
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Individual Slot
          </button>
        </div>
      </div>

      {/* Filters - only show in list mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Text Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by title, location, host, or signups..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Host Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host
              </label>
              <select
                value={filterHost}
                onChange={(e) => setFilterHost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent"
              >
                <option value="all">All Hosts</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterText('');
                  setFilterStatus('all');
                  setFilterHost('all');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredSlots.length} of {slots.length} coffee chat slots
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      <CoffeeChatBulkCreateModal
        isOpen={showBulkCreate}
        onClose={() => setShowBulkCreate(false)}
        onSuccess={() => {
          setShowBulkCreate(false);
          load();
        }}
      />

      {/* Content */}
      {viewMode === 'spreadsheet' ? (
        <CoffeeChatSpreadsheet
          slots={slots}
          teamMembers={teamMembers}
          onRefresh={load}
          currentUserEmail={session?.user?.email || undefined}
        />
      ) : (
        <div>
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading coffee chat slots...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slots.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No coffee chat slots yet</h3>
                  <p className="text-gray-600 mb-4">Create your first coffee chat slot to get started.</p>
                  <button 
                    onClick={() => setShowBulkCreate(true)}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 mr-3"
                  >
                    <CalendarDaysIcon className="w-4 h-4" />
                    Bulk Create Slots
                  </button>
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <div key={slot.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{slot.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              slot.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {slot.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Start</div>
                              <div>{formatDateTime(slot.startTime || '')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">End</div>
                              <div>{formatDateTime(slot.endTime || '')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Location</div>
                              <div>{slot.location}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Capacity</div>
                              <div>{slot.signupCount || 0} / {slot.capacity}</div>
                            </div>
                          </div>
                        </div>

                        {/* Exec Assignment */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign Exec Member
                          </label>
                          <select
                            value={slot.execMemberId || ''}
                            onChange={(e) => assignExec(slot.id!, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                          >
                            <option value="">Select an exec member...</option>
                            {teamMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} - {member.role}
                              </option>
                            ))}
                          </select>
                          {slot.execMember && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ Assigned to {slot.execMember.name}
                            </p>
                          )}
                        </div>

                        {/* Signups Section */}
                        <div className="pt-4 border-t border-gray-100">
                          <button
                            onClick={() => setShowSignups(showSignups === slot.id ? null : slot.id || null)}
                            className="inline-flex items-center gap-2 text-sm text-[#00274c] hover:text-[#003366]"
                          >
                            <EyeIcon className="w-4 h-4" />
                            {showSignups === slot.id ? 'Hide' : 'Show'} Details ({slot.signupCount || 0} signups)
                          </button>
                          
                          {showSignups === slot.id && (
                            <div className="mt-4 space-y-2">
                              {slot.signups?.map((signup) => (
                                <div key={signup.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {signup.userName || signup.userEmail.split('@')[0]}
                                    </div>
                                    <div className="text-sm text-gray-500">{signup.userEmail}</div>
                                    {signup.phone && (
                                      <div className="text-sm text-gray-500">
                                        📞 {signup.phone}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs text-gray-400">
                                      {formatSignupDate(signup.createdAt)}
                                    </div>
                                    <button
                                      onClick={() => removeSignup(slot.id!, signup.id)}
                                      disabled={removingSignup === signup.id}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                                      title="Remove signup"
                                    >
                                      {removingSignup === signup.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                      ) : (
                                        <XMarkIcon className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {!slot.signups?.length && (
                                <p className="text-gray-500 text-center py-4">No signups yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => setEditing(slot)} 
                        className="inline-flex items-center gap-2 text-sm text-[#00274c] hover:text-[#003366] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => remove(slot.id)} 
                        className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors duration-200"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editing.id ? 'Edit Coffee Chat Slot' : 'New Coffee Chat Slot'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input 
                    type="text" 
                    value={editing.title || ''}
                    onChange={(e) => setEditing({...editing, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="Coffee Chat Session"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input 
                    type="text" 
                    value={editing.location || ''}
                    onChange={(e) => setEditing({...editing, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="Ross School of Business"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Host Name *</label>
                  <input 
                    type="text" 
                    value={editing.hostName || ''}
                    onChange={(e) => setEditing({...editing, hostName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="Host Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Host Email *</label>
                  <input 
                    type="email" 
                    value={editing.hostEmail || ''}
                    onChange={(e) => setEditing({...editing, hostEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="host@umich.edu"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <input 
                    type="datetime-local" 
                    value={editing.startTime || ''}
                    onChange={(e) => setEditing({...editing, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                  <input 
                    type="datetime-local" 
                    value={editing.endTime || ''}
                    onChange={(e) => setEditing({...editing, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={editing.capacity?.toString() || '1'}
                    onChange={(e) => setEditing({...editing, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={!!editing.isOpen}
                      onChange={(e) => setEditing({...editing, isOpen: e.target.checked})}
                      className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                    />
                    Slot is open for signups
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button 
                onClick={save}
                className="flex-1 bg-[#00274c] text-white py-3 px-4 rounded-lg hover:bg-[#003366] transition-colors"
              >
                {editing.id ? 'Update Slot' : 'Create Slot'}
              </button>
              <button 
                onClick={() => setEditing(null)}
                className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}