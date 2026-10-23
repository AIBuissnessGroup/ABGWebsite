'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SignalIcon,
  StopIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { CONFERENCE_LINEUP, LineupSession, nextSessionsAfter, sessionStartTime } from '@/lib/conference-lineup';
import ConferenceSignInButton from '@/components/conference/ConferenceSignInButton';

const POLL_MS = 1500;
const PRESET_MINUTES = [5, 10, 15, 30, 45];

interface StageResponse {
  sessionIds: string[];
  timer: { status: 'idle' | 'running' | 'paused'; endsAt?: number; remainingMs?: number };
  showUpNext: boolean;
  updatedAt: number;
  updatedBy?: string;
  serverNow: number;
  canControl: boolean;
}

function plainTitle(s: LineupSession) {
  return s.headline.join(' ').replace(/\*/g, '');
}

function clock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
}

// Slides in agenda order; sessions that start together share one slide
const STEPS: LineupSession[][] = (() => {
  const steps: LineupSession[][] = [];
  const used = new Set<string>();
  for (const s of CONFERENCE_LINEUP) {
    if (used.has(s.id)) continue;
    const partner = s.concurrentWith ? CONFERENCE_LINEUP.find((p) => p.id === s.concurrentWith) : undefined;
    const group = partner ? [s, partner] : [s];
    group.forEach((g) => used.add(g.id));
    steps.push(group);
  }
  return steps;
})();

// Phone remote for the live stage screens: pick what's showing and run the timer
export default function ConferenceStageControlClient() {
  const { data: session, status } = useSession();
  const [stage, setStage] = useState<StageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [customMinutes, setCustomMinutes] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const offset = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/conference/stage', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reach the stage');
      offset.current = data.serverNow - Date.now();
      setStage(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the stage');
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    load();
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [session, load]);

  const send = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch('/api/conference/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'That didn’t go through');
      offset.current = data.serverNow - Date.now();
      setStage(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t go through');
    } finally {
      setBusy(false);
    }
  }, []);

  const current = useMemo(
    () => (stage?.sessionIds || []).map((id) => CONFERENCE_LINEUP.find((s) => s.id === id)).filter((s): s is LineupSession => Boolean(s)),
    [stage?.sessionIds]
  );
  const currentKey = current.map((s) => s.id).join(',');
  const stepIndex = STEPS.findIndex((step) => step.some((s) => current[0]?.id === s.id));
  const nextUp = current[0] ? nextSessionsAfter(current[0]) : [];

  const serverNow = now + offset.current;
  const remaining =
    stage?.timer.status === 'running'
      ? Math.max(0, (stage.timer.endsAt || 0) - serverNow)
      : stage?.timer.status === 'paused'
        ? stage.timer.remainingMs || 0
        : null;
  const untilNextMs = nextUp[0] ? sessionStartTime(nextUp[0]).getTime() - serverNow : 0;

  const showStep = (step: LineupSession[]) => send({ action: 'show', sessionIds: step.map((s) => s.id) });
  const startTimer = (ms: number) => {
    setShowPresets(false);
    send({ action: 'timer', op: 'start', ms });
  };

  // ── Gates ──
  if (status === 'loading') return <Shell><p className="py-24 text-center text-white/60">Loading…</p></Shell>;
  if (!session) {
    return (
      <Shell>
        <div className="py-16 text-center">
          <SignalIcon className="w-12 h-12 text-[#FFCB05] mx-auto" />
          <h1 className="mt-4 text-2xl font-extrabold">Stage Remote</h1>
          <p className="mt-2 text-sm text-white/70">Sign in with your admin account to control the stage screens.</p>
          <ConferenceSignInButton className="mt-6 px-6 py-3 text-sm" callbackUrl="/conference/control" />
        </div>
      </Shell>
    );
  }
  if (!stage) return <Shell><p className="py-24 text-center text-white/60">{error || 'Connecting to the stage…'}</p></Shell>;
  if (!stage.canControl) {
    return (
      <Shell>
        <div className="py-16 text-center">
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="mt-4 text-2xl font-extrabold">No remote access</h1>
          <p className="mt-2 text-sm text-white/70">The stage remote is limited to the admins on the stage controller list.</p>
          <p className="mt-3 text-xs text-white/40">Signed in as {session.user?.email}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FFCB05]">Michigan AI Business Conference</div>
          <h1 className="text-xl font-extrabold">Stage Remote</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-red-200">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Live
        </span>
      </div>

      {error && <div className="mt-3 rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-200">{error}</div>}

      {/* What the screens are showing right now */}
      <LivePreview />

      <div className="mt-3 flex items-stretch gap-2">
        <button
          onClick={() => stepIndex > 0 && showStep(STEPS[stepIndex - 1])}
          disabled={busy || stepIndex <= 0}
          className="w-14 flex-shrink-0 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-30"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="w-7 h-7" />
        </button>
        <div className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FFCB05]">
            Now showing{stepIndex >= 0 ? ` · ${stepIndex + 1} of ${STEPS.length}` : ''}
          </div>
          <div className="text-sm font-bold leading-snug truncate">{current.map(plainTitle).join(' + ')}</div>
          <div className="text-xs text-white/55 truncate">
            {current[0]?.start} · {current.map((s) => s.room).join(' & ')}
          </div>
        </div>
        <button
          onClick={() => stepIndex < STEPS.length - 1 && showStep(STEPS[stepIndex + 1])}
          disabled={busy || stepIndex >= STEPS.length - 1}
          className="w-14 flex-shrink-0 rounded-xl bg-[#FFCB05] text-[#00274c] flex items-center justify-center disabled:opacity-30"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="w-7 h-7" />
        </button>
      </div>

      {/* Timer */}
      <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">
            Countdown {nextUp[0] ? `to ${plainTitle(nextUp[0])}` : ''}
          </div>
          <div className="text-[11px] font-bold text-white/40 capitalize">{stage.timer.status === 'idle' ? 'Not running' : stage.timer.status}</div>
        </div>
        <div className={`mt-1 text-5xl font-extrabold tabular-nums ${remaining !== null && remaining <= 0 ? 'text-red-300' : 'text-[#FFCB05]'}`}>
          {remaining === null ? '—' : clock(remaining)}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {stage.timer.status === 'running' ? (
            <CtrlButton onClick={() => send({ action: 'timer', op: 'pause' })} disabled={busy} label="Pause">
              <PauseIcon className="w-5 h-5" />
            </CtrlButton>
          ) : stage.timer.status === 'paused' ? (
            <CtrlButton onClick={() => send({ action: 'timer', op: 'resume' })} disabled={busy} label="Resume" primary>
              <PlayIcon className="w-5 h-5" />
            </CtrlButton>
          ) : (
            <CtrlButton onClick={() => setShowPresets((v) => !v)} disabled={busy} label="Start" primary>
              <PlayIcon className="w-5 h-5" />
            </CtrlButton>
          )}
          <CtrlButton onClick={() => send({ action: 'timer', op: 'adjust', ms: -60000 })} disabled={busy || remaining === null} label="−1 min">
            <MinusIcon className="w-5 h-5" />
          </CtrlButton>
          <CtrlButton onClick={() => send({ action: 'timer', op: 'adjust', ms: 60000 })} disabled={busy || remaining === null} label="+1 min">
            <PlusIcon className="w-5 h-5" />
          </CtrlButton>
          <CtrlButton onClick={() => send({ action: 'timer', op: 'clear' })} disabled={busy || stage.timer.status === 'idle'} label="Clear">
            <StopIcon className="w-5 h-5" />
          </CtrlButton>
        </div>

        {(showPresets || stage.timer.status !== 'idle') && (
          <div className="mt-3">
            <div className="text-[11px] font-bold text-white/50 mb-2">{stage.timer.status === 'idle' ? 'Start a countdown' : 'Restart with'}</div>
            <div className="flex flex-wrap gap-2">
              {nextUp[0] && untilNextMs > 0 && (
                <button
                  onClick={() => startTimer(untilNextMs)}
                  disabled={busy}
                  className="rounded-lg bg-[#FFCB05]/15 border border-[#FFCB05]/50 text-[#FFCB05] px-3 py-2 text-xs font-bold"
                >
                  Until {nextUp[0].start}
                </button>
              )}
              {PRESET_MINUTES.map((m) => (
                <button key={m} onClick={() => startTimer(m * 60000)} disabled={busy} className="rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-xs font-bold">
                  {m} min
                </button>
              ))}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const m = Number(customMinutes);
                if (m > 0) {
                  startTimer(m * 60000);
                  setCustomMinutes('');
                }
              }}
            >
              <input
                type="number"
                inputMode="decimal"
                min="0.5"
                step="0.5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Custom minutes"
                className="flex-1 rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-base text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFCB05]"
              />
              <button type="submit" disabled={busy || !(Number(customMinutes) > 0)} className="rounded-lg bg-[#FFCB05] text-[#00274c] px-4 py-2 text-sm font-extrabold disabled:opacity-40">
                Start
              </button>
            </form>
          </div>
        )}

        <label
          className={`mt-4 flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 ${stage.timer.status === 'idle' ? 'opacity-50' : ''}`}
        >
          <span>
            <span className="block text-sm font-bold">Show Up next bar</span>
            <span className="block text-[11px] text-white/50">
              {stage.timer.status === 'idle' ? 'Start a countdown first' : 'Hidden again when you change slides'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={stage.showUpNext}
            onChange={(e) => send({ action: 'upnext', show: e.target.checked })}
            disabled={busy || stage.timer.status === 'idle'}
            className="w-5 h-5 accent-[#FFCB05]"
          />
        </label>
      </div>

      {/* Every slide */}
      <div className="mt-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50 mb-2">All slides</div>
        <div className="space-y-2">
          {STEPS.flatMap((step) => (step.length > 1 ? [step, ...step.map((s) => [s])] : [step])).map((step) => {
            const key = step.map((s) => s.id).join(',');
            const active = key === currentKey;
            return (
              <button
                key={key}
                onClick={() => !active && showStep(step)}
                disabled={busy}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                  active ? 'bg-[#FFCB05]/15 border-[#FFCB05]' : 'bg-white/5 border-white/10 active:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#FFCB05]">{step[0].start}</span>
                  {active && <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFCB05]">Showing</span>}
                </div>
                <div className="text-sm font-bold leading-snug">
                  {step.map(plainTitle).join(' + ')}
                  {step.length === 1 && step[0].concurrentWith && <span className="text-white/45 font-normal"> · {step[0].room} only</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {stage.updatedBy && (
        <p className="mt-4 text-center text-[11px] text-white/40">
          Last change by {stage.updatedBy} at{' '}
          {new Date(stage.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#00274c] to-[#001426] text-white">
      <div className="mx-auto max-w-md px-4 py-5 pb-10">{children}</div>
    </div>
  );
}

function CtrlButton({
  children,
  label,
  onClick,
  disabled,
  primary = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold disabled:opacity-30 ${
        primary ? 'bg-[#FFCB05] text-[#00274c]' : 'bg-white/10 border border-white/15 text-white'
      }`}
    >
      {children}
      {label}
    </button>
  );
}

// The actual live screen, scaled down to fit the phone
function LivePreview() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / 1280);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="mt-4 relative w-full overflow-hidden rounded-xl border border-white/15 bg-black" style={{ aspectRatio: '16 / 9' }}>
      <iframe
        src="/conference/background?live=1"
        title="Live stage preview"
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{ width: 1280, height: 720, transform: `scale(${scale})`, border: 0 }}
      />
    </div>
  );
}
