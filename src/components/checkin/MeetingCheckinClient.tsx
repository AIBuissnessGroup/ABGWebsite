'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingShapes from '@/components/FloatingShapes';
import Link from 'next/link';

function ConfettiCanvas() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    vx: number;
    vy: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#10B981', '#34D399', '#FFB81C', '#00274C', '#3B82F6', '#60A5FA', '#FFFFFF'];
    const newParticles = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() * 20 - 10),
      y: 40 + (Math.random() * 10 - 5),
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vx: (Math.random() - 0.5) * 85,
      vy: -(Math.random() * 65 + 30),
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            left: `${p.x + p.vx}%`,
            top: `${p.y + p.vy + 120}%`,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.25, 1, 0.3],
            rotate: p.rotation + 720,
          }}
          transition={{
            duration: 2.4 + Math.random() * 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size * (Math.random() > 0.5 ? 1 : 1.6)}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.4 ? '2px' : '999px',
          }}
        />
      ))}
    </div>
  );
}

interface MeetingCheckinClientProps {
  meetingId: string;
}

export default function MeetingCheckinClient({ meetingId }: MeetingCheckinClientProps) {
  const { data: session, status: authStatus } = useSession();
  const [meeting, setMeeting] = useState<{
    id: string;
    name: string;
    date: string;
    category: string;
    isOpen: boolean;
  } | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [userCheckedInAt, setUserCheckedInAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoading(true);
        const res = await fetch(`/api/attendance/meeting/${meetingId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load meeting details');
        }
        const data = await res.json();
        setMeeting(data.meeting);
        setAlreadyCheckedIn(Boolean(data.alreadyCheckedIn));
        if (data.userCheckedInAt) {
          setUserCheckedInAt(data.userCheckedInAt);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading meeting');
      } finally {
        setLoading(false);
      }
    }

    if (meetingId) {
      fetchStatus();
    }
  }, [meetingId, session]);

  const handleConfirmCheckin = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/attendance/meeting/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check in');
      }

      setSuccess(true);
      if (data.alreadyCheckedIn) {
        setAlreadyCheckedIn(true);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while checking in.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Education Meeting':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'Project Team':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'General Meeting':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
    }
  };

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-sm text-white/60">Loading meeting check-in...</p>
        </div>
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.05] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Meeting Not Found</h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Already checked in or just succeeded
  if (success || alreadyCheckedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
        <FloatingShapes variant="dense" opacity={0.06} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <ConfettiCanvas />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 max-w-md w-full bg-white/[0.06] border border-white/15 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/70 pt-9 pb-8 px-6 sm:px-8 text-center"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          {/* Layered Pulsing Rings with Checkmark */}
          <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-emerald-500/25 blur-sm"
            />
            <div className="absolute inset-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 animate-pulse" />

            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
              className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-600/40 border border-emerald-300/40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-9 h-9 stroke-[3]"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </motion.div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2.5">
            Attendance Confirmed
          </span>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            {alreadyCheckedIn && !success ? "You're Checked In!" : 'All Checked In!'}
          </h1>

          <p className="text-sm text-white/70 mb-5">
            Your attendance has been recorded for this session.
          </p>

          {/* Meeting Summary Box */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-left mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Meeting</span>
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getCategoryColor(meeting?.category)}`}>
                {meeting?.category || 'Meeting'}
              </span>
            </div>
            <p className="font-semibold text-white text-base leading-snug">{meeting?.name}</p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
              <span>Date: {meeting?.date}</span>
              {session?.user?.name && <span>Attendee: {session.user.name}</span>}
            </div>
            {userCheckedInAt && (
              <p className="text-[11px] text-emerald-400/80 pt-1">
                Checked in at: {new Date(userCheckedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all text-center"
            >
              Done & Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not signed in state
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingShapes variant="dense" opacity={0.06} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-20 max-w-md w-full bg-white/[0.06] border border-white/15 rounded-3xl p-7 sm:p-9 backdrop-blur-2xl shadow-2xl text-center"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#00274c] to-blue-700 border border-blue-400/30 flex items-center justify-center text-2xl shadow-lg">
            🎓
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border mb-3 ${getCategoryColor(meeting?.category)}`}>
            {meeting?.category || 'Meeting'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            {meeting?.name}
          </h1>
          <p className="text-white/60 text-sm mb-6">Date: {meeting?.date}</p>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 text-sm text-blue-200/90 text-left">
            <p className="font-semibold text-white mb-1 flex items-center gap-2">
              <span>🔒</span> Sign-In Required
            </p>
            <p className="text-xs text-white/70">
              Please sign in with your University of Michigan Google account (<span className="text-amber-300">@umich.edu</span>) to record your attendance.
            </p>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: typeof window !== 'undefined' ? window.location.href : '/' })}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-[#00274c] hover:from-blue-500 hover:to-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-900/30 transition-all border border-blue-400/30"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 1.8 14.6 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.5 2.7C6.3 7.1 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.4 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.6C.7 9 0 10.9 0 12s.7 3 1.9 5.4l3.5-2.7z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-2.1-6.6-5L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            Sign In with Google (@umich.edu)
          </button>
        </motion.div>
      </div>
    );
  }

  // Meeting closed check
  if (meeting && !meeting.isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.05] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
            ⏳
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check-in Closed</h2>
          <p className="text-white/60 text-sm mb-6">
            Attendance check-in for <strong className="text-white">{meeting.name}</strong> is currently not active. If you attended this meeting, please contact an ABG organizer.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Signed in and ready to confirm check-in!
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000a17] via-[#001428] to-[#000d1e] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingShapes variant="dense" opacity={0.06} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-b from-blue-600/15 via-emerald-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-20 max-w-md w-full bg-white/[0.06] border border-white/15 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl p-7 sm:p-9 text-center"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-teal-400" />

        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getCategoryColor(meeting?.category)}`}>
            {meeting?.category || 'Meeting'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
          {meeting?.name}
        </h1>
        <p className="text-white/60 text-sm mb-6">📅 {meeting?.date}</p>

        {/* Member Identity Card */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 text-left flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0">
            {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Checking in as</p>
            <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
            <p className="text-xs text-white/60 truncate">{session.user?.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirmCheckin}
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Confirming Attendance...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Confirm Check-In</span>
            </>
          )}
        </button>

        <p className="text-[12px] text-white/40 mt-4">
          ✓ No photo or selfie required. Tap button above to record attendance.
        </p>
      </motion.div>
    </div>
  );
}
