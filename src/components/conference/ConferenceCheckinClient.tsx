'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import jsQR from 'jsqr';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { ConferenceTicket } from '@/types/conference-ticket';
import ConferenceSignInButton from '@/components/conference/ConferenceSignInButton';

const REFRESH_MS = 15000;

type ScanResult =
  | { kind: 'checked-in'; ticket: ConferenceTicket }
  | { kind: 'already'; ticket: ConferenceTicket; at?: number | null; by?: string | null }
  | { kind: 'invalid'; ticket: ConferenceTicket; message: string }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

function timeLabel(ms?: number | null) {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

// Mobile check-in for conference passes: scan the attendee's QR code or look them up by name
export default function ConferenceCheckinClient() {
  const { data: session, status } = useSession();
  // Decided by the server: admins plus anyone on the conference's check-in staff list
  const [access, setAccess] = useState<{ state: 'checking' | 'allowed' | 'denied'; role?: 'admin' | 'staff'; reason?: string }>({
    state: 'checking',
  });
  const hasAccess = access.state === 'allowed';

  const [tickets, setTickets] = useState<ConferenceTicket[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'scan' | 'search'>('scan');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handlingScan = useRef(false);

  // Roster: loaded once and refreshed so check-ins from other phones show up
  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/conference/checkin', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        setAccess({ state: 'denied', reason: data.error });
        return null;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to load tickets');
      setAccess({ state: 'allowed', role: data.role });
      setTickets(data.tickets || []);
      setLoadError(null);
      return (data.tickets || []) as ConferenceTicket[];
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load tickets');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    loadTickets();
    const timer = setInterval(loadTickets, REFRESH_MS);
    return () => clearInterval(timer);
  }, [session, loadTickets]);

  const setCheckedIn = useCallback(async (ticket: ConferenceTicket, checkedIn: boolean) => {
    setBusyId(ticket.id);
    try {
      const res = await fetch('/api/conference/checkin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, checkedIn }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false as const, message: data.error || 'Check-in failed' };
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? { ...t, checkedIn, checkedInAt: checkedIn ? data.checkedInAt ?? Date.now() : undefined, checkedInBy: checkedIn ? data.checkedInBy : undefined }
            : t
        )
      );
      return { ok: true as const, already: Boolean(data.alreadyCheckedIn), at: data.checkedInAt, by: data.checkedInBy };
    } catch {
      return { ok: false as const, message: 'Network error. Try again.' };
    } finally {
      setBusyId(null);
    }
  }, []);

  // A scanned QR holds the pass's check-in token
  const handleCode = useCallback(
    async (code: string) => {
      const token = code.trim();
      let ticket = tickets.find((t) => t.checkInToken === token || t.ticketCode === token.toUpperCase());
      if (!ticket) {
        // Might be a pass bought after the last refresh
        const fresh = await loadTickets();
        ticket = fresh?.find((t) => t.checkInToken === token || t.ticketCode === token.toUpperCase());
      }
      if (!ticket) {
        buzz([80, 60, 80]);
        setResult({ kind: 'not-found' });
        return;
      }
      if (ticket.status !== 'confirmed') {
        buzz([80, 60, 80]);
        setResult({ kind: 'invalid', ticket, message: `This pass is ${ticket.status}.` });
        return;
      }
      if (ticket.checkedIn) {
        buzz([80, 60, 80]);
        setResult({ kind: 'already', ticket, at: ticket.checkedInAt, by: ticket.checkedInBy });
        return;
      }
      const res = await setCheckedIn(ticket, true);
      if (!res.ok) {
        buzz([80, 60, 80]);
        setResult({ kind: 'error', message: res.message });
      } else if (res.already) {
        buzz([80, 60, 80]);
        setResult({ kind: 'already', ticket, at: res.at, by: res.by });
      } else {
        buzz(120);
        setResult({ kind: 'checked-in', ticket: { ...ticket, checkedIn: true } });
      }
    },
    [tickets, loadTickets, setCheckedIn]
  );

  // Camera + QR decoding loop (paused while a result is showing)
  const scanning = hasAccess && mode === 'scan' && !result;
  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !handlingScan.current) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const image = ctx.getImageData(0, 0, w, h);
          const found = jsQR(image.data, w, h, { inversionAttempts: 'dontInvert' });
          if (found?.data) {
            handlingScan.current = true;
            handleCode(found.data).finally(() => {
              handlingScan.current = false;
            });
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        frame = requestAnimationFrame(tick);
      })
      .catch(() => setCameraError('Camera access was blocked. Allow camera access in your browser settings, or use Look up.'));

    if (!navigator.mediaDevices) setCameraError('This browser can’t open the camera. Use Look up instead.');

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, handleCode]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return tickets
      .filter(
        (t) =>
          t.attendeeName?.toLowerCase().includes(q) ||
          t.attendeeEmail?.toLowerCase().includes(q) ||
          t.ticketCode?.toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [query, tickets]);

  // ── Gates ──
  if (status === 'loading') {
    return <Screen><div className="py-24 text-center text-white/60">Loading…</div></Screen>;
  }
  if (!session) {
    return (
      <Screen>
        <div className="py-16 text-center">
          <QrCodeIcon className="w-12 h-12 text-[#FFCB05] mx-auto" />
          <h1 className="mt-4 text-2xl font-extrabold">Conference Check-in</h1>
          <p className="mt-2 text-white/70 text-sm">Sign in with your umich account to check attendees in.</p>
          <ConferenceSignInButton className="mt-6 px-6 py-3 text-sm" callbackUrl="/conference/checkin" />
        </div>
      </Screen>
    );
  }
  if (access.state === 'checking') {
    return <Screen><div className="py-24 text-center text-white/60">Checking access…</div></Screen>;
  }
  if (access.state === 'denied') {
    return (
      <Screen>
        <div className="py-16 text-center">
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="mt-4 text-2xl font-extrabold">No check-in access</h1>
          <p className="mt-2 text-white/70 text-sm">
            {access.reason === 'Check-in staff access has ended'
              ? 'Check-in staff access ended after conference day.'
              : 'Check-in is limited to admins and assigned check-in staff. Ask a conference admin to add you.'}
          </p>
          <p className="mt-3 text-xs text-white/40">Signed in as {session.user?.email}</p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FFCB05]">Michigan AI Business Conference</div>
        <h1 className="text-xl font-extrabold">
          Check-in{access.role === 'staff' && <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-white/50">Staff</span>}
        </h1>
      </div>
      {loadError && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-200">
          <span>{loadError}</span>
          <button onClick={loadTickets} className="inline-flex items-center gap-1 font-bold">
            <ArrowPathIcon className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Mode switch */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {(['scan', 'search'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setResult(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === m ? 'bg-[#FFCB05] text-[#00274c]' : 'text-white/70'
            }`}
          >
            {m === 'scan' ? <CameraIcon className="w-5 h-5" /> : <MagnifyingGlassIcon className="w-5 h-5" />}
            {m === 'scan' ? 'Scan QR' : 'Look up'}
          </button>
        ))}
      </div>

      {mode === 'scan' && (
        <div className="mt-4">
          {result ? (
            <ResultCard result={result} busy={busyId !== null} onNext={() => setResult(null)} onUndo={async (t) => {
              const res = await setCheckedIn(t, false);
              if (res.ok) setResult(null);
            }} />
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black border border-white/10">
              <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Viewfinder corners */}
              <div className="pointer-events-none absolute inset-[14%]">
                {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c) => (
                  <div key={c} className={`absolute w-10 h-10 border-[#FFCB05] rounded-sm ${c}`} />
                ))}
              </div>
              <div className="absolute bottom-3 inset-x-0 text-center text-xs font-bold text-white/80">Point at the attendee’s QR code</div>
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#00172e]/95 p-6 text-center text-sm text-white/80">{cameraError}</div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'search' && (
        <div className="mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, or ticket code"
              autoFocus
              className="w-full rounded-xl bg-white/10 border border-white/15 pl-10 pr-3 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFCB05]"
            />
          </div>
          <div className="mt-3 space-y-2">
            {query.trim().length >= 2 && matches.length === 0 && <div className="py-8 text-center text-sm text-white/50">No matching passes.</div>}
            {matches.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{t.attendeeName}</div>
                  <div className="text-xs text-white/55 truncate">{t.attendeeEmail}</div>
                  <div className="text-[11px] text-white/40 font-mono">
                    {t.ticketCode} · {t.tier}
                    {t.checkedIn && t.checkedInAt ? ` · in at ${timeLabel(t.checkedInAt)}` : ''}
                  </div>
                </div>
                {t.status !== 'confirmed' ? (
                  <span className="text-xs font-bold text-red-300 capitalize">{t.status}</span>
                ) : t.checkedIn ? (
                  <button
                    onClick={() => {
                      // Undoing is rare and easy to tap by accident, so confirm first
                      if (window.confirm(`Undo check-in for ${t.attendeeName}?`)) setCheckedIn(t, false);
                    }}
                    disabled={busyId === t.id}
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 text-emerald-300 px-3 py-2 text-xs font-bold"
                  >
                    <CheckCircleIcon className="w-4 h-4" /> In
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const res = await setCheckedIn(t, true);
                      if (res.ok) buzz(120);
                    }}
                    disabled={busyId === t.id}
                    className="flex-shrink-0 rounded-lg bg-[#FFCB05] text-[#00274c] px-4 py-2 text-sm font-extrabold disabled:opacity-60"
                  >
                    {busyId === t.id ? '…' : 'Check in'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#00274c] to-[#001426] text-white">
      <div className="mx-auto max-w-md px-4 py-5">{children}</div>
    </div>
  );
}

function ResultCard({
  result,
  busy,
  onNext,
  onUndo,
}: {
  result: ScanResult;
  busy: boolean;
  onNext: () => void;
  onUndo: (t: ConferenceTicket) => void;
}) {
  const styles = {
    'checked-in': { box: 'bg-emerald-500/15 border-emerald-400/50', icon: <CheckCircleIcon className="w-14 h-14 text-emerald-400" />, title: 'Checked in' },
    already: { box: 'bg-amber-500/15 border-amber-400/50', icon: <ExclamationTriangleIcon className="w-14 h-14 text-amber-300" />, title: 'Already checked in' },
    invalid: { box: 'bg-red-500/15 border-red-400/50', icon: <XCircleIcon className="w-14 h-14 text-red-400" />, title: 'Pass not valid' },
    'not-found': { box: 'bg-red-500/15 border-red-400/50', icon: <XCircleIcon className="w-14 h-14 text-red-400" />, title: 'Pass not found' },
    error: { box: 'bg-red-500/15 border-red-400/50', icon: <XCircleIcon className="w-14 h-14 text-red-400" />, title: 'Couldn’t check in' },
  }[result.kind];
  const ticket = 'ticket' in result ? result.ticket : null;

  return (
    <div className={`rounded-2xl border-2 p-6 text-center ${styles.box}`}>
      <div className="flex justify-center">{styles.icon}</div>
      <div className="mt-3 text-2xl font-extrabold">{styles.title}</div>
      {ticket && (
        <>
          <div className="mt-3 text-xl font-bold">{ticket.attendeeName}</div>
          <div className="text-sm text-white/60">{ticket.attendeeEmail}</div>
          <div className="mt-1 text-xs text-white/50 font-mono">
            {ticket.ticketCode} · {ticket.tier}
          </div>
        </>
      )}
      {result.kind === 'already' && (
        <div className="mt-3 text-sm text-amber-200">
          {result.at ? `Checked in at ${timeLabel(result.at)}` : 'Checked in earlier'}
          {result.by ? ` by ${result.by}` : ''}
        </div>
      )}
      {result.kind === 'invalid' && <div className="mt-3 text-sm text-red-200">{result.message}</div>}
      {result.kind === 'not-found' && <div className="mt-2 text-sm text-red-200">This QR code doesn’t match any conference pass. Try Look up.</div>}
      {result.kind === 'error' && <div className="mt-2 text-sm text-red-200">{result.message}</div>}

      <button onClick={onNext} className="mt-6 w-full rounded-xl bg-[#FFCB05] text-[#00274c] py-3.5 text-base font-extrabold">
        Scan next
      </button>
      {result.kind === 'checked-in' && ticket && (
        <button
          onClick={() => onUndo(ticket)}
          disabled={busy}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 py-2.5 text-sm font-bold text-white/80 disabled:opacity-50"
        >
          <ArrowUturnLeftIcon className="w-4 h-4" /> Undo check-in
        </button>
      )}
    </div>
  );
}
