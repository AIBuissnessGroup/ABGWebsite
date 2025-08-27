'use client';
import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, UserIcon, EnvelopeIcon, UsersIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Signup = {
  id: string;
  userEmail: string;
  userName: string | null;
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
  signups?: Signup[];
  signupCount?: number;
};

export default function AdminCoffeeChatsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignups, setShowSignups] = useState<string | null>(null);
  const [removingSignup, setRemovingSignup] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    
    // Validate required fields
    const errors = [];
    if (!editing.title?.trim()) errors.push('Title is required');
    if (!editing.startTime) errors.push('Start Time is required');
    if (!editing.endTime) errors.push('End Time is required');
    if (!editing.location?.trim()) errors.push('Location is required');
    if (!editing.hostName?.trim()) errors.push('Host Name is required');
    if (!editing.hostEmail?.trim()) errors.push('Host Email is required');
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }
    
    // Validate that end time is after start time
    if (editing.startTime && editing.endTime && new Date(editing.endTime) <= new Date(editing.startTime)) {
      alert('End Time must be after Start Time');
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
        // Update the local state with the updated slot
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coffee Chat Slots</h1>
          <p className="text-gray-600 mt-1">Manage coffee chat scheduling and availability</p>
        </div>
        <button 
          onClick={() => setEditing({ 
            title: 'Coffee Chat', 
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow at current time
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow + 1 hour
            location: 'Virtual',
            hostName: '',
            hostEmail: '',
            capacity: 1, 
            isOpen: true 
          })} 
          className="inline-flex items-center gap-2 bg-[#00274c] hover:bg-[#003366] text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          New Slot
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00274c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coffee chat slots...</p>
        </div>
      ) : (
        /* Slots List */
        <div className="space-y-4">
          {slots.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No coffee chat slots yet</h3>
              <p className="text-gray-600 mb-4">Create your first coffee chat slot to get started.</p>
              <button 
                onClick={() => setEditing({ 
                  title: 'Coffee Chat', 
                  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow at current time
                  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow + 1 hour
                  location: 'Virtual',
                  hostName: '',
                  hostEmail: '',
                  capacity: 1, 
                  isOpen: true 
                })} 
                className="inline-flex items-center gap-2 bg-[#00274c] hover:bg-[#003366] text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Slot
              </button>
            </div>
          ) : (
            slots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{slot.title || 'Untitled Slot'}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        slot.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {slot.isOpen ? 'Open' : 'Closed'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (slot.signupCount || 0) >= (slot.capacity || 1)
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {(slot.signupCount || 0)} / {slot.capacity || 1} filled
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Time:</span>
                        <span>{formatDateTime(slot.startTime || '')} - {formatDateTime(slot.endTime || '')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Location:</span>
                        <span>{slot.location || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Host:</span>
                        <span>{slot.hostName || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Capacity:</span>
                        <span>{slot.capacity || 1} person{slot.capacity !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    {slot.hostEmail && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Host Email:</span>
                        <span className="text-[#00274c]">{slot.hostEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signups Section */}
                {slot.signups && slot.signups.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Signups ({slot.signups.length})
                      </h4>
                      <button
                        onClick={() => setShowSignups(showSignups === slot.id ? null : slot.id || null)}
                        className="inline-flex items-center gap-2 text-sm text-[#00274c] hover:text-[#003366]"
                      >
                        <EyeIcon className="w-4 h-4" />
                        {showSignups === slot.id ? 'Hide' : 'Show'} Details
                      </button>
                    </div>
                    
                    {showSignups === slot.id && (
                      <div className="space-y-2">
                        {slot.signups.map((signup) => (
                          <div key={signup.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {signup.userName || signup.userEmail.split('@')[0]}
                              </div>
                              <div className="text-sm text-gray-500">{signup.userEmail}</div>
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
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setEditing(slot)} 
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => remove(slot.id)} 
                    className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md transition-colors duration-200 text-sm font-medium"
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

      {/* Edit Form Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editing.id ? 'Edit Coffee Chat Slot' : 'New Coffee Chat Slot'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Note:</span> All fields marked with <span className="text-red-500">*</span> are required. 
                  Start and End times should be in the future.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    placeholder="Coffee Chat Title" 
                    value={editing.title || ''} 
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., Room 123, Virtual" 
                    value={editing.location || ''} 
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    placeholder="Host's full name" 
                    value={editing.hostName || ''} 
                    onChange={(e) => setEditing({ ...editing, hostName: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host Email <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    type="email"
                    placeholder="host@umich.edu" 
                    value={editing.hostEmail || ''} 
                    onChange={(e) => setEditing({ ...editing, hostEmail: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    type="datetime-local"
                    value={editing.startTime || ''} 
                    onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    type="datetime-local"
                    value={editing.endTime || ''} 
                    onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:border-transparent text-gray-900 bg-white"
                    type="number" 
                    min="1"
                    placeholder="1" 
                    value={editing.capacity?.toString() || '1'} 
                    onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} 
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isOpen"
                  checked={!!editing.isOpen} 
                  onChange={(e) => setEditing({ ...editing, isOpen: e.target.checked })} 
                  className="w-4 h-4 text-[#00274c] border-gray-300 rounded focus:ring-[#00274c] focus:ring-2"
                />
                <label htmlFor="isOpen" className="text-sm font-medium text-gray-700">
                  Open for signup
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button 
                onClick={() => setEditing(null)} 
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={save} 
                className="px-4 py-2 bg-[#00274c] hover:bg-[#003366] text-white rounded-md transition-colors duration-200 font-medium"
              >
                {editing.id ? 'Update Slot' : 'Create Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


