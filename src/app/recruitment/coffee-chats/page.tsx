'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { UsersIcon, ClockIcon, MapPinIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline';

type Signup = {
  id: string;
  userEmail: string;
  userName: string | null;
  createdAt: string;
};

type Slot = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  hostName: string;
  hostEmail: string;
  capacity: number;
  isOpen: boolean;
  signups: Signup[];
  signupCount: number;
};

export default function CoffeeChatsPage() {
  const { data: session, status } = useSession();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which slot is being acted on

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recruitment/coffee-chats');
      const data = await res.json();
      setSlots(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const signup = async (slotId: string) => {
    setActionLoading(slotId);
    setMessage('');
    try {
      const res = await fetch('/api/recruitment/coffee-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slotId })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to sign up');
        setMessageType('error');
      } else {
        setMessage(data.message || 'Signed up successfully');
        setMessageType('success');
        // Reload slots to show updated signup info
        await load();
      }
    } catch (error) {
      setMessage('Failed to sign up. Please try again.');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const removeSignup = async (slotId: string) => {
    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to remove yourself from this coffee chat slot?');
    if (!confirmed) return;
    
    setActionLoading(slotId);
    setMessage('');
    try {
      const res = await fetch(`/api/recruitment/coffee-chats?slotId=${slotId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to remove signup');
        setMessageType('error');
      } else {
        setMessage(data.message || 'Successfully removed from slot');
        setMessageType('success');
        // Reload slots to show updated signup info
        await load();
      }
    } catch (error) {
      setMessage('Failed to remove signup. Please try again.');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const isUserSignedUp = (slot: Slot) => {
    if (!session?.user?.email) return false;
    return slot.signups.some(signup => signup.userEmail === session.user.email);
  };

  const formatDateTime = (dateString: string) => {
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

  const getSlotStatus = (slot: Slot) => {
    if (!slot.isOpen) return { text: 'Closed', color: 'text-red-400', bgColor: 'bg-red-900/30' };
    if (slot.signupCount >= slot.capacity) return { text: 'Full', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' };
    return { text: 'Open', color: 'text-green-400', bgColor: 'bg-green-900/30' };
  };

  // Check authentication requirement
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session?.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00274c]/80 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-3">Authentication Required</h1>
              <p className="text-[#BBBBBB] mb-6 leading-relaxed">
                Coffee chat signups require you to sign in with your University of Michigan email address.
              </p>
              
              {!session?.user ? (
                <button
                  onClick={() => signIn('google', { callbackUrl: window.location.href })}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign In with UMich Google
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                    <p className="text-red-200 text-sm">
                      You are signed in as <span className="font-medium">{session.user.email}</span>, but coffee chat signups require a @umich.edu email address.
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Sign Out & Try Different Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="heading-primary text-4xl sm:text-5xl" style={{ color: 'white' }}>
            Coffee Chats
          </h1>
          <p className="text-muted">Sign up for coffee chat slots with our team members.</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full text-sm text-green-300">
            <CheckIcon className="w-4 h-4" />
            Signed in as {session.user.name || session.user.email}
          </div>
        </header>

        {loading ? (
          <div className="glass-card p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p style={{ color: 'white' }}>Loading coffee chat slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="glass-card p-8 text-center" style={{ color: '#BBBBBB' }}>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No coffee chat slots available</h3>
            <p>No coffee chat slots are open yet. Please check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {slots.map((slot) => {
              const status = getSlotStatus(slot);
              const userSignedUp = isUserSignedUp(slot);
              
              return (
                <div key={slot.id} className="glass-card p-6 relative">
                  {/* Status Badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                    {status.text}
                  </div>

                  {/* Slot Title */}
                  <h3 className="font-semibold mb-3 pr-20" style={{ color: 'white' }}>
                    {slot.title}
                  </h3>

                  {/* Slot Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#BBBBBB' }}>
                      <ClockIcon className="w-4 h-4" />
                      <span>{formatDateTime(slot.startTime)} – {formatDateTime(slot.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#BBBBBB' }}>
                      <MapPinIcon className="w-4 h-4" />
                      <span>{slot.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#BBBBBB' }}>
                      <UserIcon className="w-4 h-4" />
                      <span>Host: {slot.hostName}</span>
                    </div>
                  </div>

                  {/* Signup Status */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-white/70" />
                      <span className="text-sm text-white/70">
                        {slot.signupCount} / {slot.capacity} spots filled
                      </span>
                    </div>
                    
                    {userSignedUp && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">You're signed up!</span>
                      </div>
                    )}
                  </div>

                  {/* Signups List */}
                  {slot.signups.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white/80 mb-2">Signed up:</h4>
                      <div className="space-y-1">
                        {slot.signups.map((signup) => (
                          <div key={signup.id} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded">
                            <span className="text-white/90">
                              {signup.userName || signup.userEmail.split('@')[0]}
                            </span>
                            {signup.userEmail === session?.user?.email && (
                              <span className="text-xs text-green-400 font-medium">(You)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="space-y-2">
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        userSignedUp
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : !slot.isOpen || slot.signupCount >= slot.capacity
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-100 text-gray-900'
                      }`}
                      disabled={actionLoading === slot.id || (!userSignedUp && (!slot.isOpen || slot.signupCount >= slot.capacity))}
                      onClick={() => userSignedUp ? removeSignup(slot.id) : signup(slot.id)}
                    >
                      {actionLoading === slot.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          {userSignedUp ? 'Removing...' : 'Signing up...'}
                        </div>
                      ) : (
                        userSignedUp 
                          ? 'Remove Signup' 
                          : !slot.isOpen 
                          ? 'Closed' 
                          : slot.signupCount >= slot.capacity 
                          ? 'Full' 
                          : 'Sign Up'
                      )}
                    </button>
                    
                    {userSignedUp && (
                      <p className="text-xs text-white/60 text-center">
                        Click "Remove Signup" to cancel your participation
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`glass-card p-4 mt-6 text-center ${
            messageType === 'success' ? 'border border-green-500/30' : 'border border-red-500/30'
          }`}>
            <p className={messageType === 'success' ? 'text-green-300' : 'text-red-300'}>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


