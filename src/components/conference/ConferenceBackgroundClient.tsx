'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, MotionGlobalConfig, Transition, motion } from 'framer-motion';
import { CameraIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  CONFERENCE_DATE_LABEL,
  CONFERENCE_LINEUP,
  CONFERENCE_VENUE,
  LineupSession,
  LineupSpeaker,
  STAGE_THANK_YOU,
  applySpeakerOrder,
  findStageSession,
  nextSessionsAfter,
  parseHeadline,
  sessionDurationLabel,
  sessionEndTime,
  sessionStartTime,
} from '@/lib/conference-lineup';
import { conferenceDisplayFont } from '@/lib/conference-fonts';
import type { ConferenceSponsor } from '@/types/conference';

const EASE = [0.22, 1, 0.36, 1] as const;
// Every screen change is a sweep of maize and blue stripes: its solid middle covers the screen,
// the content swaps underneath, and the trailing stripes reveal the new screen
// While it covers the screen, the sweep holds long enough to read the conference title card
const SWEEP_IN_S = 1.0;
const SWEEP_HOLD_S = 2.6;
const SWEEP_OUT_S = 1.1;
const SWEEP_S = SWEEP_IN_S + SWEEP_HOLD_S + SWEEP_OUT_S;
const SWEEP_TIMES = [0, SWEEP_IN_S / SWEEP_S, (SWEEP_IN_S + SWEEP_HOLD_S) / SWEEP_S, 1];
// Before each sweep the background shapes blink out
const BLINK_S = 0.6;
// From asking for a sweep to the screen being covered (callers time their changes with this)
const SWEEP_COVER_MS = (BLINK_S + SWEEP_IN_S) * 1000 + 30;
// A new screen mounts the moment the sweep covers; its entrances wait until the sweep starts to reveal it
const REVEAL_S = SWEEP_HOLD_S;
// Pieces glide in from the left behind the sweep: speakers, then title, then the bar
const ENTER_DELAY = { speakers: REVEAL_S + 0.2, title: REVEAL_S + 0.6, meta: REVEAL_S + 0.8, bar: REVEAL_S + 1.0 };
const ENTER_FROM = { opacity: 0, x: '-3vw' };
const ENTER_TO = { opacity: 1, x: '0vw' };
const INTRO_MS = 8000;
const OUTRO_MS = 7000;
const DEMO_COUNTDOWN_MS = 15000;
// Admin changes (speaker order, sponsors) reach open screens within this interval
const LIVE_POLL_MS = 5000;
// The live screen checks the stage remote this often
const STAGE_POLL_MS = 1500;
// The opening the remote's Start button plays (presented by, then the notices), before Arrival
const OPENING_MS = 40000;
// Set inline rather than with a bg-gradient-* class: a site-wide rule forces every span inside an element
// with that class to white, which would wipe out the maize words in headlines
const STAGE_BACKGROUND = { background: 'linear-gradient(to bottom right, #00274c, #00264a, #001a33)' };

interface LiveStageState {
  started: boolean;
  startedAt?: number;
  sessionIds: string[];
  timer: { status: 'idle' | 'running' | 'paused'; endsAt?: number; remainingMs?: number };
  showUpNext: boolean;
  serverNow: number;
}

const ROLE_LABEL: Record<LineupSpeaker['role'], string | null> = {
  speaker: null,
  moderator: 'Moderator',
  keynote: 'Keynote',
  host: null,
};

type OrderMap = Record<string, string[]>;

// ─────────────────────────────────────────────────────────────────────────────
// Shared pieces (sized in vw so the slide scales to any screen or projector)
// ─────────────────────────────────────────────────────────────────────────────

function HeadlineText({ line }: { line: string }) {
  return (
    <>
      {parseHeadline(line).map((seg, j) => (
        <span key={j} className={seg.maize ? 'text-[#FFCB05]' : undefined}>
          {seg.text}
        </span>
      ))}
    </>
  );
}

function Headline({ lines, size, align = 'left', delay = 0.1 }: { lines: string[]; size: string; align?: 'left' | 'center'; delay?: number }) {
  return (
    <h1
      className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.92] tracking-wide text-white ${align === 'center' ? 'text-center' : ''}`}
      style={{ fontSize: size }}
    >
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className="block"
          initial={{ opacity: 0, x: '-2vw' }}
          animate={{ opacity: 1, x: '0vw' }}
          transition={{ duration: 0.7, delay: delay + i * 0.1, ease: EASE }}
        >
          <HeadlineText line={line} />
        </motion.span>
      ))}
    </h1>
  );
}

function Logo({ speaker, height }: { speaker: LineupSpeaker; height: string }) {
  if (!speaker.logo?.src) return null;
  return (
    <div
      className={`inline-flex items-center rounded-[0.3vw] ${speaker.logo.dark ? 'bg-[#00274c] border border-white/20' : 'bg-white'}`}
      style={{ padding: '0.3vw 0.55vw' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={speaker.logo.src} alt={speaker.logo.alt} style={{ height, width: 'auto' }} className="object-contain" />
    </div>
  );
}

function HostedBy() {
  return (
    <div className="flex items-center" style={{ gap: '0.8vw' }}>
      <div className="bg-white rounded-[0.4vw]" style={{ padding: '0.4vw 0.7vw' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/conference/logos/abg.png" alt="AI Business Group" style={{ height: '1.6vw', width: 'auto' }} />
      </div>
      <div className="font-extrabold uppercase leading-tight text-white" style={{ fontSize: '0.95vw', letterSpacing: '0.08em' }}>
        Michigan AI Business Conference
        <span className="block text-white/60 font-bold">Hosted by AI Business Group</span>
      </div>
    </div>
  );
}

// Clean local logo files for the sponsors listed in the admin conference page (matched by name)
const SPONSOR_LOGOS: { match: RegExp; src: string }[] = [
  { match: /adobe/i, src: '/conference/sponsors/adobe.svg' },
  { match: /school of information|umsi/i, src: '/conference/sponsors/umsi.png' },
  { match: /eventadora/i, src: '/conference/sponsors/eventadora.png' },
  { match: /coca[\s-]?cola/i, src: '/conference/sponsors/cocacola.svg' },
  { match: /huntington/i, src: '/conference/sponsors/huntington.svg' },
  { match: /service\s?now/i, src: '/conference/sponsors/servicenow.svg' },
];

// One sponsor's logo in white, filling its cell
function SponsorMark({ sponsor }: { sponsor: ConferenceSponsor }) {
  const local = SPONSOR_LOGOS.find((l) => l.match.test(sponsor.name))?.src;
  return local ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={local} alt={sponsor.name} className="max-h-full max-w-full object-contain opacity-90" style={{ filter: 'brightness(0) invert(1)' }} />
  ) : (
    // Unknown sponsor: show its uploaded logo on a white tile so it stays legible
    <div className="bg-white rounded-[0.3vw] h-full flex items-center" style={{ padding: '0.3vw 0.5vw' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-full w-auto object-contain" />
    </div>
  );
}

// Sponsor logos in white, as a compact grid for the bottom-right corner
function SponsorLogos({
  sponsors,
  columns = 3,
  compact = false,
}: {
  sponsors: ConferenceSponsor[];
  columns?: number;
  compact?: boolean;
}) {
  if (sponsors.length === 0) return null;
  const cellWidth = compact ? '7vw' : '8.5vw';
  const cellHeight = compact ? '1.85vw' : '2.4vw';
  return (
    <motion.div
      className="flex-shrink-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: REVEAL_S + 0.4 }}
    >
      <div className="text-right font-extrabold uppercase text-white/50" style={{ fontSize: compact ? '0.6vw' : '0.7vw', letterSpacing: '0.25em', marginBottom: compact ? '0.45vw' : '0.8vw' }}>
        Sponsored by
      </div>
      <div
        className="grid items-center justify-items-center"
        style={{
          gridTemplateColumns: `repeat(${Math.min(columns, sponsors.length)}, ${cellWidth})`,
          columnGap: compact ? '1vw' : '1.6vw',
          rowGap: compact ? '0.5vw' : columns === 1 ? '1.8vw' : '1.2vw',
        }}
      >
      {sponsors.map((sp) => (
        <div key={sp.id || sp.name} className="flex items-center justify-center w-full" style={{ height: cellHeight }}>
          <SponsorMark sponsor={sp} />
        </div>
      ))}
      </div>
    </motion.div>
  );
}

// Top row shared by every slide: ABG mark on the left, sponsors stacked 3 and 3 on the right
function SlideHeader({ sponsors }: { sponsors: ConferenceSponsor[] }) {
  return (
    <div className="flex items-start justify-between" style={{ gap: '3vw', minHeight: '5vw' }}>
      <HostedBy />
      <SponsorLogos sponsors={sponsors} columns={3} compact />
    </div>
  );
}

function Eyebrow({ session }: { session: LineupSession }) {
  if (!session.label) return null;
  return (
    <span
      className="inline-block w-fit bg-[#FFCB05] text-[#00274c] font-extrabold uppercase rounded-[0.25vw]"
      style={{ fontSize: '0.95vw', padding: '0.3vw 0.8vw', letterSpacing: '0.15em' }}
    >
      {session.label}
    </span>
  );
}

// Wraps the parts of a slide that come in together (title group, meta row)
function Stage({
  enterDelay,
  className,
  style,
  children,
}: {
  enterDelay: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <motion.div className={className} style={style} initial={ENTER_FROM} animate={ENTER_TO} transition={{ duration: 0.7, delay: enterDelay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function plainTitle(session: LineupSession) {
  return session.headline.join(' ').replace(/\*/g, '');
}

function speakerNames(session: LineupSession) {
  return session.speakers.map((sp) => (sp.role === 'moderator' ? `${sp.name} (moderator)` : sp.name)).join(', ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock helpers
// ─────────────────────────────────────────────────────────────────────────────

// Ticks after mount so the server render and first client render match
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function clockText(ms: number) {
  const total = Math.ceil(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const hms = `${h > 0 || d > 0 ? `${String(h).padStart(2, '0')}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}

function Avatars({ speakers, size }: { speakers: LineupSpeaker[]; size: string }) {
  return (
    <div className="flex flex-shrink-0">
      {speakers.map((sp, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={sp.name}
          src={sp.photo}
          alt={sp.name}
          className="rounded-full object-cover grayscale border-[#001426]"
          style={{
            width: size,
            height: size,
            borderWidth: '0.15vw',
            marginLeft: i === 0 ? 0 : `calc(${size} * -0.25)`,
            objectPosition: sp.photoPosition || 'center 20%',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flyer portrait cards
// ─────────────────────────────────────────────────────────────────────────────

function FlyerCard({ speaker, index, count }: { speaker: LineupSpeaker; index: number; count: number }) {
  const width = (count >= 5 ? 11.5 : count >= 3 ? 13.5 : count === 2 ? 15 : 16) * 0.92;
  const height = width * 1.45 + (count > 2 && index % 2 === 1 ? 1.8 : 0);
  const bar = count > 1 ? (index === 0 ? 'left' : index === count - 1 ? 'right' : null) : null;
  const role = ROLE_LABEL[speaker.role];

  return (
    <motion.div
      layout
      className="relative flex-shrink-0"
      style={{ width: `${width}vw`, height: `${height}vw` }}
      initial={{ opacity: 0, x: '-4vw' }}
      animate={ENTER_TO}
      transition={{ duration: 0.7, delay: ENTER_DELAY.speakers + index * 0.08, ease: EASE, layout: { duration: 0.6, ease: EASE } }}
    >
      <div className="absolute inset-0 -skew-x-12">
        {bar && <div className="absolute bg-[#FFCB05] -z-10" style={{ top: '-1.1vw', [bar]: '-1.3vw', width: '70%', height: '46%' }} />}
        <div className="absolute inset-0 overflow-hidden border-white/85 bg-[#8d97a3]" style={{ borderWidth: '0.18vw' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={speaker.photo}
            alt={speaker.name}
            className="absolute top-0 -left-1/4 h-full w-[150%] max-w-none skew-x-12 object-cover grayscale"
            style={{ objectPosition: speaker.photoPosition || 'center 20%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[#00274c]/95" />
        </div>
        {speaker.logo?.src && (
          <div className="absolute skew-x-12" style={{ top: '0.75vw', right: '0.9vw' }}>
            <Logo speaker={speaker} height="1vw" />
          </div>
        )}
        <div className="absolute skew-x-12" style={{ left: '1.1vw', right: '0.7vw', bottom: '0.9vw' }}>
          {role && (
            <div className="inline-block bg-[#FFCB05] text-[#00274c] font-extrabold uppercase" style={{ fontSize: '0.7vw', padding: '0.15vw 0.5vw', marginBottom: '0.4vw' }}>
              {role}
            </div>
          )}
          <div className="font-bold text-white leading-tight border-b-white w-fit" style={{ fontSize: '1.1vw', paddingBottom: '0.3vw', borderBottomWidth: '0.15vw' }}>
            {speaker.name}
          </div>
          <div className="text-white/80 leading-snug" style={{ fontSize: '0.75vw', marginTop: '0.35vw' }}>
            {speaker.title}
            {speaker.company ? `, ${speaker.company}` : ''}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Up next bar (bottom of every slide)
// ─────────────────────────────────────────────────────────────────────────────

function UpNextBar({
  next,
  remaining,
  allowNoTimer = false,
}: {
  next: LineupSession[];
  remaining: number | null;
  allowNoTimer?: boolean;
}) {
  if (next.length === 0 || (remaining === null && !allowNoTimer)) return null;
  return (
    <motion.div
      className="flex items-stretch bg-[#001426]/90 border-t-[0.25vw] border-[#FFCB05]"
      initial={{ x: '-100%' }}
      animate={{ x: '0%' }}
      transition={{ duration: 0.8, delay: ENTER_DELAY.bar, ease: EASE }}
    >
      <div className="bg-[#FFCB05] text-[#00274c] flex flex-col justify-center" style={{ padding: '1vw 2vw', minWidth: '17vw' }}>
        <div className="font-extrabold uppercase" style={{ fontSize: '0.85vw', letterSpacing: '0.2em' }}>
          {remaining === null ? 'Up next at' : remaining > 0 ? 'Up next in' : 'Starting now'}
        </div>
        <div className={`${conferenceDisplayFont.className} font-extrabold tabular-nums leading-none`} style={{ fontSize: '3.2vw' }}>
          {remaining === null ? next[0].start : clockText(remaining)}
        </div>
      </div>
      <div className="flex-1 flex items-center min-w-0" style={{ padding: '1vw 2.4vw', gap: '3vw' }}>
        {next.map((s) => (
          <div key={s.id} className="flex items-center min-w-0" style={{ gap: '1.2vw' }}>
            {s.speakers.length > 0 && <Avatars speakers={s.speakers} size={next.length > 1 ? '2.8vw' : '3.4vw'} />}
            <div className="min-w-0">
              <div
                className={`${conferenceDisplayFont.className} font-extrabold uppercase text-white leading-[0.95] truncate`}
                style={{ fontSize: next.length > 1 ? '1.45vw' : '1.9vw' }}
              >
                <HeadlineText line={s.headline.join(' ')} />
              </div>
              <div className="text-white/70 font-bold truncate" style={{ fontSize: '0.95vw', marginTop: '0.25vw' }}>
                {s.start} · {s.room} · {sessionDurationLabel(s)}
                {/* With two sessions up next there isn't room for names; the photos show who's speaking */}
                {s.speakers.length > 0 && next.length === 1 && <span className="text-white/50"> · {speakerNames(s)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session slides
// ─────────────────────────────────────────────────────────────────────────────

interface SlideProps {
  session: LineupSession;
  next: LineupSession[];
  remaining: number | null;
  now: number | null;
  sponsors: ConferenceSponsor[];
  demo: boolean;
  still?: boolean; // screenshot mode: leave out anything time-based
  live?: boolean; // remote-controlled: the Up next bar shows even with no timer running
}

// Title above the speakers, date and location below, sponsors in the top-right corner
function PanelSlide({ session, next, remaining, sponsors, live = false }: SlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0" style={{ padding: '2.6vw 5vw 1.6vw' }}>
          <SlideHeader sponsors={sponsors} />
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: '1.6vw' }}>
            <Stage enterDelay={ENTER_DELAY.title} className="flex flex-col items-center">
              <Eyebrow session={session} />
              <div style={{ marginTop: '0.8vw' }}>
                <Headline lines={session.headline} size={session.speakers.length >= 5 ? '3.6vw' : '4vw'} align="center" delay={ENTER_DELAY.title} />
              </div>
            </Stage>

            <div className="flex justify-center items-end" style={{ gap: '1vw' }}>
              {session.speakers.map((sp, i) => (
                <FlyerCard key={sp.name} speaker={sp} index={i} count={session.speakers.length} />
              ))}
            </div>

            <Stage enterDelay={ENTER_DELAY.meta} className="flex flex-col items-center">
              <div className="bg-[#FFCB05]" style={{ height: '0.25vw', width: '8vw', marginBottom: '1vw' }} />
              <div className="flex flex-wrap items-center justify-center text-white/85 font-bold" style={{ gap: '1.4vw', fontSize: '1.3vw' }}>
                <span className="text-[#FFCB05] uppercase font-extrabold">{CONFERENCE_DATE_LABEL}</span>
                <span className="text-white/30">|</span>
                <span>
                  {session.start} – {session.end}
                </span>
                <span className="text-white/30">|</span>
                <span className="uppercase">{session.room}</span>
                <span className="text-white/55">{CONFERENCE_VENUE}</span>
              </div>
            </Stage>
          </div>
        </div>

      </div>
      <UpNextBar next={next} remaining={remaining} allowNoTimer={live} />
    </div>
  );
}

// Sessions running at the same time in different rooms, shown side by side
function ConcurrentSlide({
  sessions,
  next,
  remaining,
  sponsors,
  live = false,
}: {
  sessions: LineupSession[];
  next: LineupSession[];
  remaining: number | null;
  sponsors: ConferenceSponsor[];
  live?: boolean;
}) {
  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0" style={{ padding: '2.6vw 5vw 1.6vw' }}>
        <SlideHeader sponsors={sponsors} />
        <Stage enterDelay={ENTER_DELAY.title} className="text-center" style={{ marginTop: '0.6vw' }}>
          <span
            className="inline-block bg-[#FFCB05] text-[#00274c] font-extrabold uppercase rounded-[0.25vw]"
            style={{ fontSize: '0.95vw', padding: '0.3vw 0.8vw', letterSpacing: '0.15em' }}
          >
            Concurrent sessions · {sessions[0].start}
          </span>
        </Stage>
        <div className="flex-1 grid items-center" style={{ gridTemplateColumns: `repeat(${sessions.length}, 1fr)`, gap: '3vw' }}>
          {sessions.map((s, col) => (
            <div key={s.id} className={`flex flex-col items-center text-center ${col > 0 ? 'border-l border-white/10' : ''}`} style={{ gap: '1.4vw' }}>
              <Stage enterDelay={ENTER_DELAY.title} className="flex flex-col items-center">
                <Eyebrow session={s} />
                <div style={{ marginTop: '0.7vw' }}>
                  <Headline lines={[s.headline.join(' ')]} size="2.9vw" align="center" delay={ENTER_DELAY.title} />
                </div>
              </Stage>
              <div className="flex justify-center items-end" style={{ gap: '1vw' }}>
                {s.speakers.map((sp, i) => (
                  <FlyerCard key={sp.name} speaker={sp} index={i + col * 2} count={Math.max(2, s.speakers.length)} />
                ))}
              </div>
              <Stage
                enterDelay={ENTER_DELAY.meta}
                className="flex flex-wrap items-center justify-center text-white/85 font-bold"
                style={{ gap: '1vw', fontSize: '1.2vw' }}
              >
                <span className="text-[#FFCB05] uppercase font-extrabold">{s.room}</span>
                <span className="text-white/30">|</span>
                <span>
                  {s.start} – {s.end}
                </span>
              </Stage>
            </div>
          ))}
        </div>
      </div>
      <UpNextBar next={next} remaining={remaining} allowNoTimer={live} />
    </div>
  );
}

// Sessions without speakers (registration, coffee chats, closing): a "happening now" screen
function HappeningNowSlide({ session, next, remaining, now, sponsors, demo, still = false, live = false }: SlideProps) {
  // Arrival shows the whole day's lineup and a countdown to the first panel instead of the Up next bar
  const arrival = session.id === CONFERENCE_LINEUP[0].id;
  const start = sessionStartTime(session).getTime();
  const end = sessionEndTime(session).getTime();
  // In rehearsal mode the session "runs" for the length of the demo countdown
  const [demoEnd] = useState(() => Date.now() + DEMO_COUNTDOWN_MS);
  const [demoStart] = useState(() => Date.now());

  let status: 'before' | 'live' | 'after' = 'live';
  let clockLabel = 'Time left';
  let clockMs = 0;
  let progress = 0;
  if (now !== null) {
    if (demo) {
      clockMs = Math.max(0, demoEnd - now);
      progress = Math.min(1, (now - demoStart) / DEMO_COUNTDOWN_MS);
    } else if (now < start) {
      status = 'before';
      clockLabel = 'Starts in';
      clockMs = start - now;
    } else if (now < end) {
      clockMs = end - now;
      progress = (now - start) / (end - start);
    } else {
      status = 'after';
      clockLabel = 'Wrapping up';
      progress = 1;
    }
  }

  const tiles = [{ label: 'Where', value: session.room, sub: CONFERENCE_VENUE }];

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0" style={{ padding: '2.6vw 5vw 2vw' }}>
        <SlideHeader sponsors={sponsors} />

        <div className="flex-1 grid items-center" style={{ gridTemplateColumns: '1.35fr 1fr', gap: '4vw' }}>
          <Stage enterDelay={ENTER_DELAY.title}>
            <motion.div
              className="inline-flex items-center rounded-full border border-[#FFCB05]/50 bg-[#FFCB05]/10"
              style={{ gap: '0.6vw', padding: '0.4vw 1vw' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: REVEAL_S }}
            >
              <span className="relative flex" style={{ width: '0.7vw', height: '0.7vw' }}>
                {status === 'live' && !still && <span className="absolute inset-0 rounded-full bg-[#FFCB05] animate-ping opacity-70" />}
                <span className="relative rounded-full bg-[#FFCB05] w-full h-full" />
              </span>
              <span className="font-extrabold uppercase text-[#FFCB05]" style={{ fontSize: '0.95vw', letterSpacing: '0.25em' }}>
                {/* A screenshot shows the time slot instead of a live status */}
                {still ? `${session.start} – ${session.end}` : status === 'before' ? 'Coming up' : status === 'after' ? 'Just wrapped' : 'Happening now'}
              </span>
            </motion.div>

            <div style={{ marginTop: '1.4vw' }}>
              <Headline lines={[session.headline[0]]} size={session.headline[0].length > 32 ? '4.6vw' : '6.4vw'} />
            </div>
            {session.description && (
              <motion.p
                className="text-white/80 leading-relaxed"
                style={{ fontSize: '1.5vw', marginTop: '1.6vw', maxWidth: '48vw' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: REVEAL_S + 0.3 }}
              >
                {session.description}
              </motion.p>
            )}
          </Stage>

          {/* Info tiles play the role the speaker cards do on other slides */}
          <motion.div
            className="flex flex-col"
            style={{ gap: '1vw' }}
            initial={{ opacity: 0, x: '-4vw' }}
            animate={ENTER_TO}
            transition={{ duration: 0.7, delay: ENTER_DELAY.speakers, ease: EASE }}
          >
            {tiles.map((t) => (
              <div key={t.label} className="rounded-[1vw] border border-white/12 bg-white/[0.06] backdrop-blur-sm" style={{ padding: '1.1vw 1.4vw' }}>
                <div className="font-extrabold uppercase text-white/50" style={{ fontSize: '0.75vw', letterSpacing: '0.2em' }}>
                  {t.label}
                </div>
                <div className={`${conferenceDisplayFont.className} font-extrabold uppercase text-white leading-none`} style={{ fontSize: '2.6vw', marginTop: '0.4vw' }}>
                  {t.value}
                </div>
                <div className="text-white/55 font-bold" style={{ fontSize: '0.9vw', marginTop: '0.3vw' }}>
                  {t.sub}
                </div>
              </div>
            ))}
            {!still && (
            <div className="rounded-[1vw] border border-[#FFCB05]/40 bg-[#FFCB05]/[0.08]" style={{ padding: '1.1vw 1.4vw' }}>
              <div className="font-extrabold uppercase text-[#FFCB05]/80" style={{ fontSize: '0.75vw', letterSpacing: '0.2em' }}>
                {clockLabel}
              </div>
              <div className={`${conferenceDisplayFont.className} font-extrabold text-[#FFCB05] tabular-nums leading-none`} style={{ fontSize: '3.4vw', marginTop: '0.4vw' }}>
                {status === 'after' ? '—' : clockText(clockMs)}
              </div>
              <div className="rounded-full bg-white/10 overflow-hidden" style={{ height: '0.45vw', marginTop: '0.8vw' }}>
                <div className="h-full bg-[#FFCB05] rounded-full transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
            )}
          </motion.div>
        </div>
      </div>
      {arrival ? (
        <>
          <div className="flex justify-end" style={{ padding: '0 5vw 1.4vw' }}>
            <FirstPanelPopup now={now} still={still} delay={ENTER_DELAY.bar + 0.6} />
          </div>
          <LineupBar kicker="Today's" title="Lineup" delay={ENTER_DELAY.bar} />
        </>
      ) : (
        <UpNextBar next={next} remaining={remaining} allowNoTimer={live} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sweep between screens, and the intro and outro screens
// ─────────────────────────────────────────────────────────────────────────────

const SWEEP_BLUE = '#00274c';
const SWEEP_LIGHT_BLUE = '#2a5ea8';
// Left to right across the band (it travels right): thin stripes, maize, a solid blue middle wide
// enough to cover the whole screen, maize, thin stripes
const SWEEP_BANDS: [string, number][] = [
  ['#FFCB05', 1.5], [SWEEP_LIGHT_BLUE, 2], ['#FFCB05', 3], [SWEEP_BLUE, 2], ['#FFCB05', 12],
  [SWEEP_BLUE, 140],
  ['#FFCB05', 12], [SWEEP_BLUE, 2], ['#FFCB05', 3], [SWEEP_LIGHT_BLUE, 2], ['#FFCB05', 1.5],
];
const SWEEP_WIDTH = SWEEP_BANDS.reduce((sum, [, w]) => sum + w, 0);
// The band runs on a diagonal through the middle of the screen. Positions are along that diagonal,
// in vw from the screen center: the blue middle (wider than the screen's diagonal) is centered to cover it
const SWEEP_ANGLE = 30;
const SWEEP_BODY = 5; // index of the blue middle in SWEEP_BANDS
const SWEEP_COVER_X = -(SWEEP_BANDS.slice(0, SWEEP_BODY).reduce((sum, [, w]) => sum + w, 0) + SWEEP_BANDS[SWEEP_BODY][1] / 2);
const SWEEP_OFF = 60; // past the screen's corners
const SWEEP_IN_EASE: [number, number, number, number] = [0.33, 0, 0.2, 1];
const SWEEP_OUT_EASE: [number, number, number, number] = [0.7, 0, 0.8, 0.4];

// ─────────────────────────────────────────────────────────────────────────────
// Background shapes: the site's floating outline shapes. They blink out just before a sweep, then blink
// back in as the trailing stripes reveal them
// ─────────────────────────────────────────────────────────────────────────────

interface ShapeWaveState {
  id: number;
  startCovered: boolean; // the sweep opened already covering, so there's no leading edge
  at: number; // performance.now() when the sweep started
}
const ShapeWave = createContext<ShapeWaveState | null>(null);

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond';
// Same layout as the site's FloatingShapes (dense)
const STAGE_SHAPES = Array.from({ length: 12 }, (_, i) => ({
  kind: (['circle', 'square', 'triangle', 'diamond'] as ShapeKind[])[i % 4],
  animation: ['float-slow', 'float-medium', 'float-fast', 'pulse-shape'][i % 4],
  delay: ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5'][i % 5],
  top: seededRandom(i * 1000 + 1) * 80 + 10,
  left: seededRandom(i * 1000 + 2) * 80 + 10,
  size: seededRandom(i * 1000 + 3) * 60 + 20,
}));
type StageShape = (typeof STAGE_SHAPES)[number];

// Time fraction at which a cubic-bezier easing reaches `progress`
function easeTimeAt([x1, y1, x2, y2]: [number, number, number, number], progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const y = 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
    if (y >= p) return 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3;
  }
  return 1;
}

// Seconds after the band starts moving when the trailing stripes uncover the shape
function shapeRevealAt(shape: StageShape, startCovered: boolean) {
  const angle = (SWEEP_ANGLE * Math.PI) / 180;
  // Position along the sweep's direction, in vw from the screen center (the screen is 56.25vw tall)
  const along = (shape.left - 50) * Math.cos(angle) + (shape.top - 50) * 0.5625 * Math.sin(angle);
  const lead = startCovered ? 0 : SWEEP_IN_S;
  return lead + SWEEP_HOLD_S + SWEEP_OUT_S * easeTimeAt(SWEEP_OUT_EASE, (along - SWEEP_COVER_X) / (SWEEP_OFF - SWEEP_COVER_X));
}

function ShapeOutline({ kind, size, color }: { kind: ShapeKind; size: number; color: string }) {
  if (kind === 'triangle') {
    return <div style={{ width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }} />;
  }
  return (
    <div
      className={kind === 'circle' ? 'rounded-full' : kind === 'square' ? 'rounded-lg' : 'rotate-45'}
      style={{ width: size, height: size, border: `2px solid ${color}` }}
    />
  );
}

// Blink patterns (opacity steps). The shapes keep floating while they flicker out, and flicker back in
const BLINK_OUT = [1, 0.15, 1, 0, 0.85, 0, 0.5, 0];
const BLINK_IN_S = 0.45;
const BLINK_IN = [0, 0.8, 0, 0.6, 0, 1];

// One shape's blinks for the current sweep (remounted per sweep, so the timeline starts fresh)
function ShapeBlink({ shape, index, wave, opacity }: { shape: StageShape; index: number; wave: ShapeWaveState | null; opacity: number }) {
  const [timeline] = useState(() => {
    if (!wave) return null;
    const elapsed = (performance.now() - wave.at) / 1000;
    // A little stagger so they don't all blink in lockstep
    const outStart = wave.startCovered ? null : seededRandom(index * 7 + wave.id) * 0.12 - elapsed;
    const inStart = (wave.startCovered ? 0 : BLINK_S) + shapeRevealAt(shape, wave.startCovered) - elapsed;
    if (inStart < 0) return null; // mounted after it blinked back in: just show it

    const points: { t: number; o: number }[] = [];
    if (outStart !== null && outStart >= 0) {
      const step = (BLINK_S - 0.12) / (BLINK_OUT.length - 1);
      BLINK_OUT.forEach((o, i) => points.push({ t: outStart + i * step, o }));
    }
    const step = BLINK_IN_S / (BLINK_IN.length - 1);
    BLINK_IN.forEach((o, i) => points.push({ t: inStart + i * step, o }));
    // Shapes that missed the blink-out (the screen was already covered) start hidden
    if (points[0].t > 0) points.unshift({ t: 0, o: points[0].o });
    const duration = points[points.length - 1].t;
    return {
      initial: points[0].o,
      opacity: points.map((p) => p.o),
      transition: { duration, times: points.map((p) => p.t / duration), ease: 'linear' as const },
    };
  });
  return (
    <motion.div
      initial={timeline ? { opacity: timeline.initial } : false}
      animate={timeline ? { opacity: timeline.opacity } : undefined}
      transition={timeline?.transition}
    >
      <ShapeOutline kind={shape.kind} size={shape.size} color={`rgba(255, 255, 255, ${opacity})`} />
    </motion.div>
  );
}

function StageShapes({ opacity = 0.08 }: { opacity?: number }) {
  const wave = useContext(ShapeWave);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STAGE_SHAPES.map((shape, i) => (
        <div key={i} className={`floating-shape ${shape.animation} ${shape.delay}`} style={{ top: `${shape.top}%`, left: `${shape.left}%` }}>
          <ShapeBlink key={wave?.id ?? 0} shape={shape} index={i} wave={wave} opacity={opacity} />
        </div>
      ))}
      <div className="floating-shape orbit-shape delay-1" style={{ top: '20%', left: '80%' }}>
        <div className="w-4 h-4 bg-white rounded-full" style={{ opacity: opacity * 2 }} />
      </div>
      <div className="floating-shape orbit-shape delay-3" style={{ top: '70%', left: '15%' }}>
        <div className="w-6 h-6 border-2 rounded-full" style={{ borderColor: `rgba(255, 255, 255, ${opacity})` }} />
      </div>
    </div>
  );
}

// Shown on the sweep's blue middle. Builds in pieces once the screen is covered (logo springs in,
// title words rise through masks, sponsors land one by one), then holds still while the sweep's
// trailing edge wipes over it.
const CARD_TITLE = ['Michigan', 'AI', 'Business', 'Conference'];

function SweepCard({ sponsors }: { sponsors: ConferenceSponsor[] }) {
  return (
    <div className="flex flex-col items-center text-center text-white">
      <motion.div
        className="bg-white rounded-[0.6vw]"
        style={{ padding: '0.6vw 1.1vw' }}
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: '0vw' }}
        transition={{ type: 'spring', stiffness: 260, damping: 15 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/conference/logos/abg.png" alt="AI Business Group" style={{ height: '3vw', width: 'auto' }} />
      </motion.div>

      <div
        className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.95] tracking-wide flex flex-wrap justify-center`}
        style={{ fontSize: '5.6vw', marginTop: '1.6vw', columnGap: '0.28em' }}
      >
        {CARD_TITLE.map((word, i) => (
          <span key={word} className="inline-block overflow-hidden" style={{ paddingBottom: '0.06em' }}>
            <motion.span
              className={`inline-block ${word === 'AI' ? 'text-[#FFCB05]' : ''}`}
              initial={{ y: '110%', rotate: 6 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{ duration: 0.75, delay: 0.12 + i * 0.07, ease: EASE }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </div>

      <motion.div
        className="font-extrabold uppercase text-white/75"
        style={{ fontSize: '1.25vw', marginTop: '1vw' }}
        initial={{ opacity: 0, letterSpacing: '0.9em' }}
        animate={{ opacity: 1, letterSpacing: '0.3em', y: '0vw' }}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
      >
        Hosted by AI Business Group
      </motion.div>
      <motion.div
        className="font-bold uppercase text-[#FFCB05]"
        style={{ fontSize: '1vw', letterSpacing: '0.18em', marginTop: '0.6vw' }}
        initial={{ opacity: 0, y: '0.6vw' }}
        animate={{ opacity: 1, y: '0vw' }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
      >
        {CONFERENCE_DATE_LABEL} · {CONFERENCE_VENUE}
      </motion.div>

      {sponsors.length > 0 && (
        <>
          <motion.div
            className="bg-[#FFCB05]"
            style={{ height: '0.2vw', margin: '2.2vw 0 1.4vw' }}
            initial={{ width: '0vw' }}
            animate={{ width: '6vw' }}
            transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
          />
          <motion.div
            className="font-extrabold uppercase text-white/50"
            style={{ fontSize: '0.8vw', letterSpacing: '0.3em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: '0vw' }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Sponsored by
          </motion.div>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: '1.2vw 2.6vw', marginTop: '1.2vw', maxWidth: '72vw' }}>
            {sponsors.map((sp, i) => (
              <motion.div
                key={sp.id || sp.name}
                className="flex items-center justify-center"
                style={{ width: '9vw', height: '2.6vw' }}
                initial={{ opacity: 0, y: '1.2vw', filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: '0vw', filter: 'blur(0px)' }}
                transition={{ duration: 0.55, delay: 0.75 + i * 0.07, ease: EASE }}
              >
                <SponsorMark sponsor={sp} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// `startCovered`: the page opens under the sweep (title card showing) and it moves off to reveal the first screen
function Sweep({
  onCovered,
  sponsors,
  startCovered = false,
  withCard = true,
}: {
  onCovered: () => void;
  sponsors: ConferenceSponsor[];
  startCovered?: boolean;
  withCard?: boolean; // off right after the opening, which just showed the same logo and sponsors
}) {
  const covered = useRef(onCovered);
  useEffect(() => {
    if (startCovered) return;
    const timer = setTimeout(() => covered.current(), SWEEP_COVER_MS);
    return () => clearTimeout(timer);
  }, [startCovered]);
  // The band waits while the background shapes blink out (not when the page opens already covered)
  const wait = startCovered ? 0 : BLINK_S;

  const startX = -SWEEP_WIDTH - SWEEP_OFF;
  const start = `${startX}vw`;
  const cover = `${SWEEP_COVER_X}vw`;
  const end = `${SWEEP_OFF}vw`;
  // The card moves exactly opposite to the band (same timing and easing), so it stays still on screen
  // while the band's edge passes over it
  const cardX = (bandX: number) => `${SWEEP_COVER_X - bandX}vw`;
  const outEase = SWEEP_OUT_EASE;
  const lead = startCovered ? 0 : SWEEP_IN_S;
  const duration = lead + SWEEP_HOLD_S + SWEEP_OUT_S;
  const at = (sec: number) => Math.min(1, Math.max(0, sec / duration));
  const moveTransition: Transition = startCovered
    ? { duration, times: [0, at(SWEEP_HOLD_S), 1], ease: ['linear', outEase] }
    : { duration, times: SWEEP_TIMES, ease: [SWEEP_IN_EASE, 'linear', outEase], delay: wait };

  // The card builds as soon as the screen is covered
  const [showCard, setShowCard] = useState(startCovered);
  useEffect(() => {
    if (startCovered) return;
    const timer = setTimeout(() => setShowCard(true), (BLINK_S + SWEEP_IN_S - 0.05) * 1000);
    return () => clearTimeout(timer);
  }, [startCovered]);

  return (
    <div className="absolute inset-0 z-[60] overflow-hidden pointer-events-none">
      <div className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${SWEEP_ANGLE}deg)` }}>
        <motion.div
          className="absolute flex"
          style={{ top: '-70vw', height: '140vw', width: `${SWEEP_WIDTH}vw` }}
          initial={{ x: startCovered ? cover : start }}
          animate={{ x: startCovered ? [cover, cover, end] : [start, cover, cover, end] }}
          transition={moveTransition}
        >
          {SWEEP_BANDS.map(([color, width], i) =>
            i === SWEEP_BODY ? (
              // The blue middle clips the card, so the trailing stripes wipe it away
              <div key={i} className="relative h-full flex-shrink-0 overflow-hidden" style={{ width: `${width}vw`, background: color }}>
                {/* Starts moving with the band; the card itself mounts (and builds in) once the screen is covered */}
                <motion.div
                  className="absolute left-1/2 top-1/2"
                  initial={{ x: startCovered ? '0vw' : cardX(startX) }}
                  animate={{ x: startCovered ? ['0vw', '0vw', cardX(SWEEP_OFF)] : [cardX(startX), '0vw', '0vw', cardX(SWEEP_OFF)] }}
                  transition={moveTransition}
                >
                  {showCard && withCard && (
                    <div className="absolute left-0 top-0" style={{ width: '90vw', transform: `translate(-50%, -50%) rotate(${-SWEEP_ANGLE}deg)` }}>
                      <SweepCard sponsors={sponsors} />
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              <div key={i} className="h-full flex-shrink-0" style={{ width: `${width}vw`, background: color }} />
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}

function TransitionScreen({ kicker, sessions }: { kicker: string; sessions: LineupSession[] }) {
  const session = sessions[0];
  const concurrent = sessions.length > 1;
  const speakers = sessions.flatMap((s) => s.speakers);
  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#00274c] flex items-center justify-center">
      <StageShapes opacity={0.08} />

      <div className="relative text-center" style={{ padding: '0 8vw' }}>
        <motion.div
          className="inline-flex items-center"
          style={{ gap: '1vw' }}
          initial={ENTER_FROM}
          animate={ENTER_TO}
          transition={{ duration: 0.7, delay: REVEAL_S + 0.7, ease: EASE }}
        >
          <div className="bg-white rounded-[0.5vw]" style={{ padding: '0.5vw 0.9vw' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/conference/logos/abg.png" alt="AI Business Group" style={{ height: '2.4vw', width: 'auto' }} />
          </div>
          <div className="text-left font-extrabold uppercase text-white leading-tight" style={{ fontSize: '1.2vw', letterSpacing: '0.1em' }}>
            Michigan AI Business Conference
            <span className="block text-white/55">
              {CONFERENCE_DATE_LABEL} · {CONFERENCE_VENUE}
            </span>
          </div>
        </motion.div>

        <motion.div
          className="font-extrabold uppercase text-[#FFCB05]"
          style={{ fontSize: '1.4vw', letterSpacing: '0.35em', marginTop: '3vw' }}
          initial={{ opacity: 0, letterSpacing: '0.8em' }}
          animate={{ opacity: 1, letterSpacing: '0.35em' }}
          transition={{ duration: 0.9, delay: REVEAL_S + 1.1, ease: EASE }}
        >
          {kicker}
        </motion.div>

        <h2
          className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.92] text-white`}
          style={{ fontSize: concurrent ? '3.6vw' : speakers.length > 0 ? '4.8vw' : '6vw', marginTop: '1.2vw' }}
        >
          {/* Concurrent sessions get one line each */}
          {(concurrent ? sessions.map((s) => s.headline.join(' ')) : session.headline).map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: REVEAL_S + 1.4 + i * 0.15, ease: EASE }}
              >
                <HeadlineText line={line} />
              </motion.span>
            </span>
          ))}
        </h2>

        <motion.div
          className="mx-auto bg-[#FFCB05]"
          style={{ height: '0.3vw', marginTop: '2vw' }}
          initial={{ width: 0 }}
          animate={{ width: '20vw' }}
          transition={{ duration: 0.9, delay: REVEAL_S + 2.0, ease: EASE }}
        />

        <motion.div
          className="text-white/80 font-bold uppercase"
          style={{ fontSize: '1.4vw', letterSpacing: '0.12em', marginTop: '1.4vw' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: REVEAL_S + 2.3 }}
        >
          {session.start} · {sessions.map((s) => s.room).join(' & ')}
        </motion.div>

        {/* Speakers pop in one after another */}
        {speakers.length > 0 && (
          <div className="flex justify-center items-start" style={{ gap: '1.4vw', marginTop: '2.2vw' }}>
            {speakers.map((sp, i) => (
              <motion.div
                key={sp.name}
                className="flex flex-col items-center"
                style={{ width: '9vw' }}
                initial={{ opacity: 0, scale: 0.3, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18, delay: REVEAL_S + 2.2 + i * 0.12 }}
              >
                <div className="relative -skew-x-12 overflow-hidden border-white/85" style={{ width: '7vw', height: '9vw', borderWidth: '0.15vw' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sp.photo}
                    alt={sp.name}
                    className="absolute top-0 -left-1/4 h-full w-[150%] max-w-none skew-x-12 object-cover grayscale"
                    style={{ objectPosition: sp.photoPosition || 'center 20%' }}
                  />
                </div>
                <div className="font-bold text-white leading-tight" style={{ fontSize: '0.95vw', marginTop: '0.6vw' }}>
                  {sp.name}
                </div>
                {ROLE_LABEL[sp.role] && (
                  <div className="font-extrabold uppercase text-[#FFCB05]" style={{ fontSize: '0.65vw', letterSpacing: '0.12em', marginTop: '0.15vw' }}>
                    {ROLE_LABEL[sp.role]}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Opening (live screen only): plays on black when the remote taps Start
// ─────────────────────────────────────────────────────────────────────────────

const NOTICES = [
  {
    icon: CameraIcon,
    title: 'This event is being photographed',
    text: "By attending, you consent to AI Business Group using photos that may include you in our communications and promotion. If you'd prefer not to be photographed, let a member of our team know.",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Speakers' views are their own",
    text: 'Views expressed by speakers and panelists are their own and do not necessarily reflect those of the University of Michigan, the Ross School of Business, AI Business Group or our sponsors.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Conduct and safety',
    text: 'Please treat speakers, staff and fellow attendees with respect. Note the nearest exits, follow staff instructions in an emergency, and find an ABG team member if you need anything.',
  },
];

// Seconds into the opening: "presented by" until PART_B, the notices (one at a time) until END, then a
// slow fade and BLACK_HOLD seconds of black before the sweep into Arrival
const OPENING_PART_B = 13;
const OPENING_END = 31;
const OPENING_FADE_S = 3;
const OPENING_BLACK_HOLD = 5;
const OPENING_DONE = OPENING_END + OPENING_FADE_S + OPENING_BLACK_HOLD;
const NOTICE_GAP_S = 4.5;

function OpeningSequence({ sponsors, onDone }: { sponsors: ConferenceSponsor[]; onDone: () => void }) {
  const [part, setPart] = useState<'presented' | 'notices' | 'black'>('presented');
  const done = useRef(onDone);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPart('notices'), OPENING_PART_B * 1000),
      setTimeout(() => setPart('black'), OPENING_END * 1000),
      setTimeout(() => done.current(), OPENING_DONE * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white">
      <AnimatePresence mode="wait">
        {part === 'presented' && (
          <motion.div
            key="presented"
            className="flex flex-col items-center text-center"
            exit={{ opacity: 0, y: '-1vw', transition: { duration: 1, ease: EASE } }}
          >
            <motion.div
              className="font-extrabold uppercase text-[#FFCB05]"
              style={{ fontSize: '1.1vw' }}
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.4em' }}
              transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
            >
              Presented by
            </motion.div>
            <motion.div
              className="bg-white rounded-[0.7vw]"
              style={{ padding: '0.8vw 1.4vw', marginTop: '2vw' }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 1.2 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/conference/logos/abg.png" alt="AI Business Group" style={{ height: '4.2vw', width: 'auto' }} />
            </motion.div>
            <div className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-none tracking-wide overflow-hidden`} style={{ fontSize: '5vw', marginTop: '1.6vw' }}>
              <motion.div initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 0.9, delay: 1.8, ease: EASE }}>
                AI Business Group
              </motion.div>
            </div>
            <motion.div
              className="font-bold uppercase text-white/60"
              style={{ fontSize: '1.1vw', letterSpacing: '0.2em', marginTop: '0.8vw' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.4 }}
            >
              Michigan AI Business Conference · {CONFERENCE_DATE_LABEL}
            </motion.div>
            {sponsors.length > 0 && (
              <>
                <motion.div
                  className="bg-[#FFCB05]"
                  style={{ height: '0.2vw', margin: '2.6vw 0 1.6vw' }}
                  initial={{ width: '0vw' }}
                  animate={{ width: '6vw' }}
                  transition={{ duration: 0.8, delay: 3.0, ease: EASE }}
                />
                <motion.div
                  className="font-extrabold uppercase text-white/50"
                  style={{ fontSize: '0.85vw', letterSpacing: '0.3em' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 3.3 }}
                >
                  With thanks to our sponsors
                </motion.div>
                <div className="flex flex-wrap items-center justify-center" style={{ gap: '1.4vw 3vw', marginTop: '1.4vw', maxWidth: '76vw' }}>
                  {sponsors.map((sp, i) => (
                    <motion.div
                      key={sp.id || sp.name}
                      className="flex items-center justify-center"
                      style={{ width: '10vw', height: '3vw' }}
                      initial={{ opacity: 0, y: '1.2vw', filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: '0vw', filter: 'blur(0px)' }}
                      transition={{ duration: 0.6, delay: 3.6 + i * 0.15, ease: EASE }}
                    >
                      <SponsorMark sponsor={sp} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {part === 'notices' && (
          <motion.div
            key="notices"
            className="flex flex-col items-center"
            style={{ width: '78vw' }}
            exit={{ opacity: 0, transition: { duration: OPENING_FADE_S, ease: 'easeInOut' } }}
          >
            <motion.div
              className="font-extrabold uppercase text-[#FFCB05]"
              style={{ fontSize: '1.1vw', letterSpacing: '0.4em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.4 }}
            >
              Before we begin
            </motion.div>
            <div className="w-full flex flex-col" style={{ gap: '1.4vw', marginTop: '2.4vw' }}>
              {NOTICES.map((n, i) => (
                <motion.div
                  key={n.title}
                  className="flex items-start border-l-[0.25vw] border-[#FFCB05] bg-white/[0.04]"
                  style={{ gap: '1.8vw', padding: '1.4vw 2vw' }}
                  initial={{ opacity: 0, x: '-2vw' }}
                  animate={{ opacity: 1, x: '0vw' }}
                  transition={{ duration: 1.6, delay: 1.5 + i * NOTICE_GAP_S, ease: EASE }}
                >
                  <n.icon className="flex-shrink-0 text-[#FFCB05]" style={{ width: '2.6vw', height: '2.6vw' }} />
                  <div>
                    <div className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-none`} style={{ fontSize: '2.2vw' }}>
                      {n.title}
                    </div>
                    <div className="text-white/75 leading-snug" style={{ fontSize: '1.25vw', marginTop: '0.6vw' }}>
                      {n.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thank-you screen: the last slide, after closing remarks
// ─────────────────────────────────────────────────────────────────────────────

// The whole day's lineup along the bottom of a slide, stepping to the next session every few seconds
const LINEUP_STEP_MS = 5000;

function LineupBar({ kicker, title, delay }: { kicker: string; title: string; delay: number }) {
  const count = CONFERENCE_LINEUP.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [instant, setInstant] = useState(false);

  // Where each session starts along the track (re-measured if the screen size changes)
  useEffect(() => {
    const measure = () => {
      const items = Array.from(trackRef.current?.children || []) as HTMLElement[];
      setOffsets(items.map((el) => el.offsetLeft - (items[0]?.offsetLeft || 0)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setInstant(false);
      setStep((n) => n + 1);
    }, LINEUP_STEP_MS);
    return () => clearInterval(timer);
  }, []);

  // The list is drawn twice; after gliding onto the second copy's first session, snap back to the
  // identical first copy so it loops forever
  useEffect(() => {
    if (step < count) return;
    const timer = setTimeout(() => {
      setInstant(true);
      setStep(0);
    }, 900);
    return () => clearTimeout(timer);
  }, [step, count]);

  const items = [0, 1].flatMap((copy) =>
    CONFERENCE_LINEUP.map((s) => (
      <div key={`${copy}-${s.id}`} className="flex items-center flex-shrink-0" style={{ gap: '1.1vw', paddingLeft: '2.4vw', paddingRight: '1.4vw' }}>
        <span className={`${conferenceDisplayFont.className} font-extrabold text-[#FFCB05] tabular-nums`} style={{ fontSize: '1.7vw' }}>
          {s.start}
        </span>
        {s.speakers.length > 0 && <Avatars speakers={s.speakers} size="2.4vw" />}
        <span className="flex flex-col">
          <span className={`${conferenceDisplayFont.className} font-extrabold uppercase text-white leading-none`} style={{ fontSize: '1.6vw' }}>
            <HeadlineText line={s.headline.join(' ')} />
          </span>
          <span className="text-white/60 font-bold" style={{ fontSize: '0.85vw', marginTop: '0.25vw' }}>
            {s.room}
            {s.speakers.length > 0 && <span className="text-white/45"> · {speakerNames(s)}</span>}
          </span>
        </span>
        <span className="rotate-45 bg-[#FFCB05] flex-shrink-0" style={{ width: '0.5vw', height: '0.5vw', marginLeft: '1vw' }} />
      </div>
    ))
  );

  return (
    <motion.div
      className="flex items-stretch bg-[#001426]/90 border-t-[0.25vw] border-[#FFCB05]"
      initial={{ x: '-100%' }}
      animate={{ x: '0%' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <div className="relative z-10 bg-[#FFCB05] text-[#00274c] flex flex-col justify-center flex-shrink-0" style={{ padding: '1vw 2vw', minWidth: '15vw' }}>
        <div className="font-extrabold uppercase" style={{ fontSize: '0.85vw', letterSpacing: '0.2em' }}>
          {kicker}
        </div>
        <div className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-none`} style={{ fontSize: '2.6vw' }}>
          {title}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-center text-left" style={{ padding: '0.9vw 0' }}>
        <motion.div
          ref={trackRef}
          className="flex whitespace-nowrap"
          animate={{ x: -(offsets[step] || 0) }}
          transition={instant ? { duration: 0 } : { duration: 0.8, ease: EASE }}
        >
          {items}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Arrival: a card above the lineup bar counting down to the first panel
function FirstPanelPopup({ now, still, delay }: { now: number | null; still: boolean; delay: number }) {
  const panel = CONFERENCE_LINEUP.find((s) => s.kind === 'panel');
  if (!panel) return null;
  const remaining = now === null ? null : sessionStartTime(panel).getTime() - now;
  return (
    <motion.div
      className="flex items-center bg-[#001426]/90 border border-white/10 border-l-[0.3vw] border-l-[#FFCB05] rounded-r-[0.8vw]"
      style={{ gap: '1.6vw', padding: '1vw 1.6vw' }}
      initial={{ opacity: 0, y: '2vw', scale: 0.92 }}
      animate={{ opacity: 1, y: '0vw', scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay }}
    >
      <div className="flex flex-col">
        <span className="font-extrabold uppercase text-[#FFCB05]/80" style={{ fontSize: '0.75vw', letterSpacing: '0.2em' }}>
          {still || remaining === null ? 'First panel' : remaining > 0 ? 'First panel in' : 'First panel'}
        </span>
        <span className={`${conferenceDisplayFont.className} font-extrabold text-[#FFCB05] tabular-nums leading-none`} style={{ fontSize: '3vw', marginTop: '0.3vw' }}>
          {still || remaining === null ? panel.start : remaining > 0 ? clockText(remaining) : 'Now'}
        </span>
      </div>
      <Avatars speakers={panel.speakers} size="3vw" />
      <div className="flex flex-col text-left" style={{ maxWidth: '26vw' }}>
        <span className={`${conferenceDisplayFont.className} font-extrabold uppercase text-white leading-[0.95]`} style={{ fontSize: '1.6vw' }}>
          <HeadlineText line={panel.headline.join(' ')} />
        </span>
        <span className="text-white/60 font-bold" style={{ fontSize: '0.85vw', marginTop: '0.35vw' }}>
          {panel.label} · {panel.start} · {panel.room}
        </span>
      </div>
    </motion.div>
  );
}

function ThankYouScreen({ sponsors }: { sponsors: ConferenceSponsor[] }) {
  const d = REVEAL_S;
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center text-center text-white" style={{ padding: '3vw 6vw 9vw' }}>
      {/* The usual logo and conference name, top-left like every other slide */}
      <motion.div
        className="absolute"
        style={{ top: '2.6vw', left: '5vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: d + 0.1 }}
      >
        <HostedBy />
      </motion.div>

      <div
        className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.95] tracking-wide flex flex-wrap justify-center`}
        style={{ fontSize: '7vw', columnGap: '0.28em' }}
      >
        {['Thank', 'you', 'for', 'attending'].map((word, i) => (
          <span key={word} className="inline-block overflow-hidden" style={{ paddingBottom: '0.06em' }}>
            <motion.span
              className={`inline-block ${i < 2 ? 'text-[#FFCB05]' : ''}`}
              initial={{ y: '110%', rotate: 6 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{ duration: 0.8, delay: d + 0.3 + i * 0.08, ease: EASE }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </div>

      <motion.div
        className="font-bold uppercase text-white/60"
        style={{ fontSize: '1.2vw', letterSpacing: '0.2em', marginTop: '1vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: d + 0.8 }}
      >
        Michigan AI Business Conference · {CONFERENCE_DATE_LABEL}
      </motion.div>

      <motion.div
        className="inline-flex items-center rounded-full border border-[#FFCB05]/60 bg-[#FFCB05]/10"
        style={{ gap: '0.7vw', padding: '0.6vw 1.5vw', marginTop: '2vw' }}
        initial={{ opacity: 0, y: '1vw' }}
        animate={{ opacity: 1, y: '0vw' }}
        transition={{ duration: 0.7, delay: d + 1.0, ease: EASE }}
      >
        <span className="relative flex" style={{ width: '0.8vw', height: '0.8vw' }}>
          <span className="absolute inset-0 rounded-full bg-[#FFCB05] animate-ping opacity-70" />
          <span className="relative rounded-full bg-[#FFCB05] w-full h-full" />
        </span>
        <span className="font-extrabold uppercase text-[#FFCB05]" style={{ fontSize: '1.3vw', letterSpacing: '0.2em' }}>
          Open networking
        </span>
      </motion.div>

      {sponsors.length > 0 && (
        <>
          <motion.div
            className="bg-[#FFCB05]"
            style={{ height: '0.2vw', margin: '2.8vw 0 1.6vw' }}
            initial={{ width: '0vw' }}
            animate={{ width: '7vw' }}
            transition={{ duration: 0.8, delay: d + 1.2, ease: EASE }}
          />
          <motion.div
            className="font-extrabold uppercase text-white/55"
            style={{ fontSize: '0.95vw', letterSpacing: '0.3em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: d + 1.3 }}
          >
            Thank you to our sponsors
          </motion.div>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: '1.6vw 3.2vw', marginTop: '1.6vw', maxWidth: '80vw' }}>
            {sponsors.map((sp, i) => (
              <motion.div
                key={sp.id || sp.name}
                className="flex items-center justify-center"
                style={{ width: '11vw', height: '3.4vw' }}
                initial={{ opacity: 0, y: '1.2vw' }}
                animate={{ opacity: 1, y: '0vw' }}
                transition={{ duration: 0.6, delay: d + 1.4 + i * 0.1, ease: EASE }}
              >
                <SponsorMark sponsor={sp} />
              </motion.div>
            ))}
          </div>
        </>
      )}

      <div className="absolute left-0 right-0 bottom-0">
        <LineupBar kicker="Day" title="Recap" delay={d + 1.8} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One session's stage screen
// ─────────────────────────────────────────────────────────────────────────────

function StageScreen({
  sessions,
  demo,
  skipIntro,
  order,
  sponsors,
  onAdvance,
  runSweep,
  still = false,
  manual,
}: {
  sessions: LineupSession[];
  demo: boolean;
  skipIntro: boolean;
  order: OrderMap;
  sponsors: ConferenceSponsor[];
  onAdvance: (next: LineupSession[]) => void;
  runSweep: (onCovered: () => void) => void; // the page-level sweep; the change happens while it covers the screen
  still?: boolean;
  // Remote-controlled: the timer and Up next bar come from the stage remote, and nothing advances on its own
  manual?: { remaining: number | null; showUpNext: boolean };
}) {
  const session = sessions[0];
  const thankYou = session.id === STAGE_THANK_YOU.id;
  // Coming from an outro, the "Up next" screen already introduced this session, so go straight to it
  const [phase, setPhase] = useState<'intro' | 'live' | 'outro'>(skipIntro || still || thankYou ? 'live' : 'intro');
  // Memoized so the hand-off timers aren't reset by every clock tick
  const nextSessions = useMemo(() => nextSessionsAfter(session), [session]);
  const [target] = useState<number | null>(() =>
    nextSessions.length === 0 ? null : demo ? Date.now() + DEMO_COUNTDOWN_MS : sessionStartTime(nextSessions[0]).getTime()
  );
  const now = useNow();
  const remaining = manual ? manual.remaining : target === null || now === null ? null : Math.max(0, target - now);

  // Intro: sweep to the slide once it has played
  useEffect(() => {
    if (phase !== 'intro') return;
    const timer = setTimeout(() => runSweep(() => setPhase('live')), INTRO_MS - SWEEP_COVER_MS);
    return () => clearTimeout(timer);
  }, [phase, runSweep]);

  // Only hand off if the countdown actually ran out while this screen was up (a screen opened late stays put)
  const sawTimeLeft = useRef(false);
  const handingOff = useRef(false);
  useEffect(() => {
    if (remaining === null) return;
    if (remaining > 0) {
      sawTimeLeft.current = true;
      return;
    }
    if (sawTimeLeft.current && phase === 'live' && nextSessions[0] && !still && !manual && !handingOff.current) {
      handingOff.current = true;
      runSweep(() => setPhase('outro'));
    }
  }, [remaining, phase, nextSessions, still, manual, runSweep]);

  // Outro: sweep to the next session
  useEffect(() => {
    if (phase !== 'outro' || !nextSessions[0]) return;
    const timer = setTimeout(() => runSweep(() => onAdvance(nextSessions)), OUTRO_MS - SWEEP_COVER_MS);
    return () => clearTimeout(timer);
  }, [phase, nextSessions, onAdvance, runSweep]);

  const ordered = sessions.map((s) => applySpeakerOrder(s, order[s.id]));
  const orderedNext = nextSessions.map((s) => applySpeakerOrder(s, order[s.id]));
  const Slide = session.speakers.length > 0 ? PanelSlide : HappeningNowSlide;
  // Screenshots leave out the Up next bar and its countdown; the remote can hide it too
  const barNext = still || (manual && !manual.showUpNext) ? [] : orderedNext;
  const barRemaining = still ? null : remaining;
  const live = Boolean(manual);

  if (thankYou) return <ThankYouScreen sponsors={sponsors} />;
  if (phase === 'intro') return <TransitionScreen kicker={ordered.length > 1 ? 'Concurrent sessions' : session.label || 'Now'} sessions={ordered} />;
  if (phase === 'outro' && orderedNext.length > 0) return <TransitionScreen kicker="Up next" sessions={orderedNext} />;
  return ordered.length > 1 ? (
    <ConcurrentSlide sessions={ordered} next={barNext} remaining={barRemaining} sponsors={sponsors} live={live} />
  ) : (
    <Slide session={ordered[0]} next={barNext} remaining={barRemaining} now={now} sponsors={sponsors} demo={demo} still={still} live={live} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ConferenceBackgroundClient({
  sessionId,
  demo = false,
  skipIntro = false,
  shot = false,
  live = false,
}: {
  sessionId?: string;
  demo?: boolean;
  skipIntro?: boolean;
  shot?: boolean;
  live?: boolean;
}) {
  const router = useRouter();

  // One sweep overlay for the whole page, so it carries on while the screen underneath changes
  // The first sweep is already covering when the page opens, then reveals the first screen
  const [sweepId, setSweepId] = useState(1);
  // No title card on the way into the thank-you screen, which shows the same logo and sponsors
  const [sweepCard, setSweepCard] = useState(sessionId !== STAGE_THANK_YOU.id);
  const [sweepAt, setSweepAt] = useState(() => (typeof performance === 'undefined' ? 0 : performance.now()));
  const onCovered = useRef<() => void>(() => {});
  const runSweep = useCallback((cb: () => void, opts?: { card?: boolean }) => {
    onCovered.current = cb;
    setSweepCard(opts?.card ?? true);
    setSweepAt(performance.now());
    setSweepId((n) => n + 1);
  }, []);
  // The background shapes flip as the sweep passes (the live screen's first sweep starts later, after Start)
  const shapeWave = useMemo<ShapeWaveState | null>(
    () => (shot || (live && sweepId === 1) ? null : { id: sweepId, startCovered: sweepId === 1, at: sweepAt }),
    [shot, live, sweepId, sweepAt]
  );

  // Live mode: what's on screen and the timer come from the /conference/control remote
  const [stage, setStage] = useState<LiveStageState | null>(null);
  const clockOffset = useRef(0);
  const liveNow = useNow();
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const load = () =>
      fetch('/api/conference/stage', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data || data.error) return;
          // Correct for this screen's clock being ahead of or behind the server
          clockOffset.current = data.serverNow - Date.now();
          setStage(data);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, STAGE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [live]);

  // Black until the remote taps Start; then the opening plays (unless it's already over, e.g. after a
  // refresh) and the sweep brings in the stage
  const [screenMode, setScreenMode] = useState<'standby' | 'opening' | 'stage' | null>(null);
  useEffect(() => {
    if (!live || !stage) return;
    if (!stage.started) {
      setScreenMode('standby');
      return;
    }
    setScreenMode((mode) => {
      if (mode === 'opening' || mode === 'stage') return mode;
      return stage.serverNow - (stage.startedAt || 0) < OPENING_MS ? 'opening' : 'stage';
    });
  }, [live, stage]);

  // When the remote picks a new slide, a sweep covers the screen and the new one is underneath it
  const targetKey = stage ? stage.sessionIds.join(',') : null;
  const [shownKey, setShownKey] = useState<string | null>(null);
  const pendingKey = useRef<string | null>(null);
  useEffect(() => {
    if (!live || !targetKey) return;
    // Off stage (black or the opening), just keep up; there's nothing on screen to sweep away
    if (shownKey === null || screenMode !== 'stage') {
      if (targetKey !== shownKey) setShownKey(targetKey);
      return;
    }
    if (targetKey === shownKey) return;
    // Mid-sweep picks just retarget it
    const sweeping = pendingKey.current !== null;
    pendingKey.current = targetKey;
    if (sweeping) return;
    runSweep(
      () => {
        setShownKey(pendingKey.current);
        pendingKey.current = null;
      },
      { card: targetKey !== STAGE_THANK_YOU.id }
    );
  }, [live, targetKey, shownKey, screenMode, runSweep]);

  const liveRemaining = (() => {
    if (!stage || liveNow === null) return null;
    if (stage.timer.status === 'running') return Math.max(0, (stage.timer.endsAt || 0) - (liveNow + clockOffset.current));
    if (stage.timer.status === 'paused') return stage.timer.remainingMs || 0;
    return null;
  })();

  // After an outro the next session is swapped in here under the sweep (and the URL updated) rather than
  // waiting on a page navigation, so the swap always lands while the screen is covered
  const [advanced, setAdvanced] = useState<{ from?: string; ids: string } | null>(null);
  const activeAdvance = advanced && advanced.from === sessionId ? advanced : null;
  const activeId = activeAdvance ? activeAdvance.ids : sessionId;
  const activeSkipIntro = activeAdvance ? true : skipIntro;

  // "s" may list several ids separated by commas when sessions run at the same time
  const sessions = ((live ? shownKey : activeId) || '')
    .split(',')
    .map((id) => findStageSession(id))
    .filter((s): s is LineupSession => Boolean(s));
  const session = sessions[0] || null;
  const index = session ? CONFERENCE_LINEUP.indexOf(session) : -1;
  const [cursorHidden, setCursorHidden] = useState(false);
  const [order, setOrder] = useState<OrderMap>({});
  const [sponsors, setSponsors] = useState<ConferenceSponsor[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const sweep = <Sweep key={sweepId} onCovered={() => onCovered.current()} sponsors={sponsors} startCovered={sweepId === 1} withCard={sweepCard} />;
  const shotRef = useRef<HTMLDivElement>(null);
  const [shotState, setShotState] = useState<'preparing' | 'capturing' | 'done' | 'error'>('preparing');

  // Screenshots render everything in its final state, so a capture never catches a half-finished
  // entrance animation (or a paused one if the tab is in the background). Set before children mount.
  if (shot) MotionGlobalConfig.skipAnimations = true;
  useEffect(() => {
    if (!shot) return;
    return () => {
      MotionGlobalConfig.skipAnimations = false;
    };
  }, [shot]);

  // Speaker order and sponsors come from the admin conference page; poll so open screens update live
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/conference', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data || data.error) return;
          setOrder(data.backgroundSpeakerOrder || {});
          setSponsors([...(data.sponsors || [])].sort((a: ConferenceSponsor, b: ConferenceSponsor) => (a.order ?? 0) - (b.order ?? 0)));
        })
        .catch(() => {})
        .finally(() => !cancelled && setSettingsLoaded(true));
    load();
    const timer = setInterval(load, LIVE_POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const onAdvance = useCallback(
    (next: LineupSession[]) => {
      const ids = next.map((s) => s.id).join(',');
      setAdvanced({ from: sessionId, ids });
      window.history.replaceState(null, '', `/conference/background?s=${ids}${demo ? '&demo=1' : ''}&from=outro`);
    },
    [sessionId, demo]
  );

  // Arrow keys step through sessions; the cursor hides when idle so it doesn't sit on the projector
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir || live) return;
      const next = CONFERENCE_LINEUP[(index + dir + CONFERENCE_LINEUP.length) % CONFERENCE_LINEUP.length];
      router.replace(`/conference/background?s=${next.id}${demo ? '&demo=1' : ''}`);
    };
    let timer: ReturnType<typeof setTimeout>;
    const onMove = () => {
      setCursorHidden(false);
      clearTimeout(timer);
      timer = setTimeout(() => setCursorHidden(true), 2000);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMove);
    onMove();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMove);
    };
  }, [session, index, demo, live, router]);

  const shotFileName = `michigan-ai-conference-${sessions.map((s) => s.id).join('-') || 'slide'}.png`;

  // Renders the 16:9 slide at 1920x1080 and downloads it
  const captureShot = useCallback(async () => {
    const node = shotRef.current;
    if (!node) return;
    setShotState('capturing');
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(node, { pixelRatio: 1920 / node.offsetWidth, cacheBust: true, backgroundColor: '#00274c' });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = shotFileName;
      link.click();
      setShotState('done');
    } catch (err) {
      console.error('Screenshot failed:', err);
      setShotState('error');
    }
  }, [shotFileName]);

  // Wait for sponsors and speaker order, then for the entrance animations to finish
  useEffect(() => {
    if (!shot || !session || !settingsLoaded) return;
    const timer = setTimeout(captureShot, 1200);
    return () => clearTimeout(timer);
  }, [shot, session, settingsLoaded, captureShot]);

  if (live) {
    return (
      <ShapeWave.Provider value={shapeWave}>
      <div
        className={`fixed inset-0 overflow-hidden text-white ${cursorHidden ? 'cursor-none' : ''}`}
        style={STAGE_BACKGROUND}
      >
        <StageShapes opacity={0.08} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,203,5,0.08),transparent_55%)] pointer-events-none" />
        {stage && session && screenMode === 'stage' && (
          <StageScreen
            key={sessions.map((s) => s.id).join(',')}
            sessions={sessions}
            demo={false}
            skipIntro={false}
            order={order}
            sponsors={sponsors}
            onAdvance={() => {}}
            runSweep={runSweep}
            manual={{ remaining: liveRemaining, showUpNext: stage.showUpNext }}
          />
        )}
        {screenMode !== 'stage' && (
          <div className="absolute inset-0 z-40 bg-black">
            {screenMode === 'opening' && <OpeningSequence sponsors={sponsors} onDone={() => runSweep(() => setScreenMode('stage'), { card: false })} />}
          </div>
        )}
        {(screenMode === 'stage' || sweepId > 1) && sweep}
      </div>
      </ShapeWave.Provider>
    );
  }

  if (!session) {
    const indexRows = CONFERENCE_LINEUP.flatMap((s) => {
      const row = { key: s.id, ids: s.id, start: s.start, title: plainTitle(s), note: s.concurrentWith ? `${s.room} only` : '' };
      const partner = s.concurrentWith && CONFERENCE_LINEUP.find((p) => p.id === s.concurrentWith);
      // Add the combined slide once, ahead of the first of the pair
      if (partner && CONFERENCE_LINEUP.indexOf(partner) > CONFERENCE_LINEUP.indexOf(s)) {
        return [
          {
            key: `${s.id}+${partner.id}`,
            ids: `${s.id},${partner.id}`,
            start: s.start,
            title: `${plainTitle(s)} + ${plainTitle(partner)}`,
            note: 'Both sessions side by side (the screen moves here automatically)',
          },
          row,
        ];
      }
      return [row];
    });
    indexRows.push({ key: STAGE_THANK_YOU.id, ids: STAGE_THANK_YOU.id, start: 'After closing', title: 'Thank you for attending', note: 'Final screen: open networking and sponsors' });
    return (
      <div className="min-h-screen bg-[#00274c] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className={`${conferenceDisplayFont.className} text-5xl font-extrabold uppercase`}>
            Stage <span className="text-[#FFCB05]">Backgrounds</span>
          </h1>
          <p className="mt-3 text-white/70">
            Open a session full screen on the projector. When the countdown to the next session ends, the screen plays an outro and moves to
            that session on its own. Arrow keys switch sessions manually. &ldquo;Rehearse&rdquo; runs a 15-second countdown. Speaker order
            and sponsors are set in the admin conference page and update on open screens within a few seconds.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#FFCB05]/40 bg-[#FFCB05]/10 px-4 py-3">
            <div>
              <div className="font-bold text-[#FFCB05]">Live screen (controlled from your phone)</div>
              <div className="text-xs text-white/60">Shows whatever the stage remote picks, with the timer you start. Nothing changes on its own.</div>
            </div>
            <div className="flex gap-2">
              <Link href="/conference/background?live=1" className="rounded-lg bg-[#FFCB05] text-[#00274c] px-3 py-1.5 text-xs font-bold">
                Open live screen
              </Link>
              <Link href="/conference/control" className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-bold hover:border-white/60">
                Stage remote
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {indexRows.map(({ key, ids, start, title, note }) => (
              <div key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="w-24 text-sm font-bold text-[#FFCB05]">{start}</div>
                <div className="flex-1 min-w-[200px] font-semibold">
                  {title}
                  {note && <span className="block text-xs font-normal text-white/50">{note}</span>}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/conference/background?s=${ids}`}
                    className="rounded-lg bg-[#FFCB05]/15 border border-[#FFCB05]/50 text-[#FFCB05] px-3 py-1.5 text-xs font-bold hover:bg-[#FFCB05]/25"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/conference/background?s=${ids}&demo=1`}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold hover:border-white/50"
                  >
                    Rehearse
                  </Link>
                  <a
                    href={`/conference/background?s=${ids}&shot=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold hover:border-white/50"
                    title="Download a 1920×1080 image of this slide for slideshows"
                  >
                    Download PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (shot) {
    return (
      <div className="min-h-screen bg-[#000d1a] text-white">
        {/* The 16:9 slide that gets captured */}
        <div
          ref={shotRef}
          className="relative w-screen overflow-hidden"
          style={{ ...STAGE_BACKGROUND, height: '56.25vw' }}
        >
          <StageShapes opacity={0.08} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,203,5,0.08),transparent_55%)] pointer-events-none" />
          <StageScreen
            sessions={sessions}
            demo={false}
            skipIntro
            still
            order={order}
            sponsors={sponsors}
            onAdvance={() => {}}
            runSweep={() => {}}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-6 text-sm">
          <span className="text-white/70">
            {shotState === 'preparing' && 'Preparing your image…'}
            {shotState === 'capturing' && 'Creating the 1920×1080 image…'}
            {shotState === 'done' && `Downloaded ${shotFileName}`}
            {shotState === 'error' && 'Something went wrong creating the image.'}
          </span>
          <button
            onClick={captureShot}
            disabled={shotState === 'preparing' || shotState === 'capturing'}
            className="rounded-lg bg-[#FFCB05] text-[#00274c] px-4 py-2 font-bold disabled:opacity-50"
          >
            Download again
          </button>
          <Link href="/conference/background" className="rounded-lg border border-white/20 px-4 py-2 font-bold hover:border-white/50">
            All backgrounds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ShapeWave.Provider value={shapeWave}>
    <div
      className={`fixed inset-0 overflow-hidden text-white ${cursorHidden ? 'cursor-none' : ''}`}
      style={STAGE_BACKGROUND}
    >
      <StageShapes opacity={0.08} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,203,5,0.08),transparent_55%)] pointer-events-none" />
      <StageScreen
        key={`${sessions.map((s) => s.id).join(',')}-${demo}`}
        sessions={sessions}
        demo={demo}
        skipIntro={activeSkipIntro}
        order={order}
        sponsors={sponsors}
        onAdvance={onAdvance}
        runSweep={runSweep}
      />
      {sweep}
    </div>
    </ShapeWave.Provider>
  );
}
