'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  CalendarDaysIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface ConferenceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalendarSession {
  id: string;
  summary: string;
  location: string;
  description: string;
  startTime: string;
  endTime: string;
}

export default function ConferenceCalendarModal({ isOpen, onClose }: ConferenceCalendarModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState<number | null>(null);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [paidOnly, setPaidOnly] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    createdCount?: number;
    totalSessions?: number;
    createdEvents?: Array<{ title: string; id: string; htmlLink?: string }>;
    errors?: Array<{ title: string; error: string }>;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setFetchingPreview(true);
      fetch('/api/admin/conference/calendar-invites')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAttendeeCount(data.attendeeCount);
            setTicketCount(data.ticketCount);
            setSessions(data.sessions || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load preview:', err);
        })
        .finally(() => {
          setFetchingPreview(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendInvites = async (dryRun: boolean = false) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/conference/calendar-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, paidOnly }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to send calendar invites');
        setResult({
          success: false,
          message: data.error || 'Unknown error occurred.',
          errors: data.errors,
        });
      } else {
        if (dryRun) {
          toast.success(data.message || 'Dry run completed successfully!');
          setResult({
            success: true,
            message: `Dry Run Passed: ${data.attendeeCount} attendees identified across ${data.eventsCount} sessions. No calendar events were inserted.`,
          });
        } else {
          toast.success(`Successfully sent calendar invites for ${data.createdCount} sessions!`);
          setResult({
            success: true,
            createdCount: data.createdCount,
            totalSessions: data.totalSessions,
            createdEvents: data.createdEvents,
            errors: data.errors,
          });
        }
      }
    } catch (err: any) {
      toast.error('Network error executing calendar invite operation');
      setResult({
        success: false,
        message: err.message || 'Network error.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#00274c] to-[#003875] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maize/20 border border-maize/30 flex items-center justify-center text-[#FFCB05]">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Sync Google Calendar Invites
              </h3>
              <p className="text-xs text-blue-200">
                Michigan AI Business Conference 2026 · Friday, Oct 23
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Overview & Audience Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 mb-1">
                <UserGroupIcon className="w-4 h-4 text-[#00274c]" />
                <span>Ticket Holders</span>
              </div>
              <div className="text-2xl font-black text-[#00274c]">
                {fetchingPreview ? '...' : attendeeCount ?? 0}
              </div>
              <p className="text-[11px] text-blue-700/80 mt-0.5">
                Confirmed attendees with emails
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1">
                <CalendarDaysIcon className="w-4 h-4 text-[#FF6700]" />
                <span>Sessions</span>
              </div>
              <div className="text-2xl font-black text-amber-900">7</div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                From Registration to Closing
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 mb-1">
                <SparklesIcon className="w-4 h-4 text-emerald-700" />
                <span>Delivery Method</span>
              </div>
              <div className="text-xs font-bold text-emerald-900 mt-1">Official GCal Invite</div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">
                Includes RSVP & alerts
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={paidOnly}
                onChange={(e) => setPaidOnly(e.target.checked)}
                className="w-4 h-4 text-[#00274c] rounded border-gray-300 focus:ring-[#00274c]"
              />
              <span className="text-xs font-medium text-gray-700">
                Only invite paid ticket holders (exclude complimentary passes)
              </span>
            </label>
            <span className="text-[11px] text-gray-500">
              Primary Google Account: <span className="font-mono font-semibold">abgumich.org</span>
            </span>
          </div>

          {/* 7 Events List */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>Events to Schedule & Invite ({sessions.length || 7} total)</span>
            </h4>

            <div className="space-y-2">
              {(sessions.length > 0 ? sessions : [
                { id: '1', summary: 'Registration & Arrival', startTime: '2026-10-23T10:30:00', endTime: '11:00 AM', location: 'Stewart Lobby' },
                { id: '2', summary: 'Opening Remarks (Julia Lotz)', startTime: '2026-10-23T11:00:00', endTime: '11:15 AM', location: 'Blau Colloquium' },
                { id: '3', summary: "AI Inside the World's Biggest Banks and Funds", startTime: '2026-10-23T11:15:00', endTime: '12:15 PM', location: 'Blau Colloquium' },
                { id: '4', summary: 'Lunch & Learn (Bitcoin 101 & Professional Brand)', startTime: '2026-10-23T12:15:00', endTime: '1:15 PM', location: 'R2220 & R2230' },
                { id: '5', summary: "Engineering the Future: AI at Microsoft's Core (Jennifer Marsman)", startTime: '2026-10-23T13:15:00', endTime: '2:15 PM', location: 'Robertson Auditorium' },
                { id: '6', summary: 'From Pitch to Portfolio: Building and Funding the AI Wave', startTime: '2026-10-23T15:45:00', endTime: '4:30 PM', location: 'Robertson Auditorium' },
                { id: '7', summary: 'Closing Remarks & Networking', startTime: '2026-10-23T16:30:00', endTime: '5:00 PM', location: 'Robertson Auditorium & Lobby' },
              ]).map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors shadow-2xs text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{s.summary}</div>
                      <div className="flex items-center gap-2 text-gray-500 text-[11px] mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                          {s.location?.split(',')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-[11px]">
                      {s.startTime.includes('T') ? s.startTime.split('T')[1].slice(0, 5) : s.startTime} EDT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div
              className={`p-4 rounded-2xl border ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm mb-2">
                {result.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{result.success ? 'Calendar Synchronization Complete' : 'Sync Issue Encountered'}</span>
              </div>
              <p className="text-xs leading-relaxed">{result.message}</p>

              {result.createdEvents && result.createdEvents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Created Calendar Events:
                  </span>
                  {result.createdEvents.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="truncate pr-2 font-medium">{ev.title}</span>
                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline shrink-0"
                        >
                          View in Google Cal
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200 space-y-1">
                  <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                    Errors:
                  </span>
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-xs text-red-700">
                      • <span className="font-semibold">{err.title}</span>: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-all"
          >
            Close
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              disabled={loading || attendeeCount === 0}
              onClick={() => handleSendInvites(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#00274c] text-[#00274c] hover:bg-blue-50 text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
            >
              <span>Test Preview (Dry Run)</span>
            </button>

            <button
              type="button"
              disabled={loading || attendeeCount === 0}
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to create 7 Google Calendar events and send official calendar invitations to all ${attendeeCount} confirmed ticket holders?`
                  )
                ) {
                  handleSendInvites(false);
                }
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003875] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <CalendarDaysIcon className="w-4 h-4 text-[#FFCB05]" />
              <span>{loading ? 'Creating & Sending...' : `Send Calendar Invites (${attendeeCount ?? 0})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
