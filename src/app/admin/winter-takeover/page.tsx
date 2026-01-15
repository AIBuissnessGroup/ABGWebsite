'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RocketLaunchIcon, ArrowPathIcon, CheckCircleIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';

function WinterTakeoverControl() {
  const [isTriggered, setIsTriggered] = useState(false);
  const [triggeredAt, setTriggeredAt] = useState<string | null>(null);
  const [countdownDate, setCountdownDate] = useState<string>('');
  const [countdownTime, setCountdownTime] = useState<string>('');
  const [savedCountdownDate, setSavedCountdownDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check current state on load
  useEffect(() => {
    checkState();
  }, []);

  const checkState = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/winter-takeover');
      const data = await res.json();
      setIsTriggered(data.triggered);
      setTriggeredAt(data.triggeredAt);
      
      if (data.countdownDate) {
        const date = new Date(data.countdownDate);
        setSavedCountdownDate(data.countdownDate);
        // Format for input fields
        setCountdownDate(date.toISOString().split('T')[0]);
        setCountdownTime(date.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to check state:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSaveCountdown = async () => {
    if (!countdownDate || !countdownTime) {
      alert('Please select both date and time');
      return;
    }
    
    setSavingDate(true);
    try {
      const dateTime = new Date(`${countdownDate}T${countdownTime}:00`);
      
      const res = await fetch('/api/admin/winter-takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setCountdown', countdownDate: dateTime.toISOString() }),
      });
      
      if (res.ok) {
        setSavedCountdownDate(dateTime.toISOString());
        alert('✅ Countdown date saved! All users will see this date.');
      }
    } catch (error) {
      console.error('Failed to save countdown:', error);
      alert('Failed to save countdown date');
    } finally {
      setSavingDate(false);
    }
  };

  const handleTrigger = async () => {
    if (!confirm('🚀 Are you sure you want to trigger the Winter Takeover?\n\nThis will start the animation sequence for ALL users currently viewing the recruitment page!')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/winter-takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      });
      
      if (res.ok) {
        setIsTriggered(true);
        setTriggeredAt(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to trigger:', error);
      alert('Failed to trigger takeover');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ Are you sure you want to reset the Winter Takeover?\n\nThis will allow you to trigger it again later.')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/winter-takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      if (res.ok) {
        setIsTriggered(false);
        setTriggeredAt(null);
      }
    } catch (error) {
      console.error('Failed to reset:', error);
      alert('Failed to reset takeover');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time until countdown
  const getTimeUntil = () => {
    if (!savedCountdownDate) return null;
    const diff = new Date(savedCountdownDate).getTime() - Date.now();
    if (diff <= 0) return 'Countdown ended - ready to trigger!';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m until countdown ends`;
    if (hours > 0) return `${hours}h ${minutes}m until countdown ends`;
    return `${minutes}m until countdown ends`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">❄️ Winter Takeover Control</h1>
        <p className="text-gray-400 mb-8">Control the recruitment page launch animation</p>

        {checking ? (
          <div className="flex items-center gap-2 text-gray-400">
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            Checking status...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Countdown Date Setting */}
            <div className="p-6 rounded-2xl border bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Countdown Date & Time</h2>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">
                Set when the countdown on /recruitment should end. Users will see this countdown.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={countdownDate}
                    onChange={(e) => setCountdownDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Time (EST)</label>
                  <input
                    type="time"
                    value={countdownTime}
                    onChange={(e) => setCountdownTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {savedCountdownDate && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Current: {new Date(savedCountdownDate).toLocaleString()}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">{getTimeUntil()}</p>
                </div>
              )}
              
              <button
                onClick={handleSaveCountdown}
                disabled={savingDate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl font-medium transition-colors"
              >
                {savingDate ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-5 h-5" />
                    Save Countdown Date
                  </>
                )}
              </button>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border ${isTriggered ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <div className="flex items-center gap-3 mb-4">
                {isTriggered ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 border-2 border-yellow-400 animate-pulse" />
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {isTriggered ? 'Takeover Triggered!' : 'Ready to Launch'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {isTriggered 
                      ? `Triggered at ${new Date(triggeredAt!).toLocaleString()}`
                      : 'Waiting for admin trigger'}
                  </p>
                </div>
              </div>
              
              {isTriggered && (
                <p className="text-green-300 text-sm">
                  ✅ All users on /recruitment have seen or are seeing the takeover animation
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {!isTriggered ? (
                <motion.button
                  onClick={handleTrigger}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-7 h-7 animate-spin" />
                  ) : (
                    <RocketLaunchIcon className="w-7 h-7" />
                  )}
                  {loading ? 'Triggering...' : '🚀 LAUNCH WINTER TAKEOVER'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleReset}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="w-5 h-5" />
                  )}
                  {loading ? 'Resetting...' : 'Reset (Allow Re-trigger)'}
                </motion.button>
              )}
              
              <button
                onClick={checkState}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Refresh Status
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <h3 className="font-semibold mb-2">📋 How it works:</h3>
              <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                <li><strong>Set countdown date</strong> - Users see countdown until this time</li>
                <li>Users visit <code className="bg-gray-700 px-1 rounded">/recruitment</code> and see the countdown</li>
                <li>When countdown ends, they see &quot;Applications Are Ready!&quot; with a waiting state</li>
                <li>When you click &quot;Launch Winter Takeover&quot;, ALL users see the animation simultaneously</li>
                <li>The 10-second buildup starts, followed by the full takeover sequence</li>
              </ol>
            </div>

            {/* Preview Link */}
            <a 
              href="/recruitment" 
              target="_blank"
              className="block text-center text-blue-400 hover:text-blue-300 underline"
            >
              Open /recruitment in new tab to preview →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAdminPageProtection(WinterTakeoverControl, 'events');
