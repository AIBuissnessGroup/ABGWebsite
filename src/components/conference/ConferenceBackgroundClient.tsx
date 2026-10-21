'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingShapes from '@/components/FloatingShapes';
import {
  CONFERENCE_DATE_LABEL,
  CONFERENCE_LINEUP,
  CONFERENCE_VENUE,
  LineupSession,
  LineupSpeaker,
  applySpeakerOrder,
  nextSessionsAfter,
  parseHeadline,
  sessionDurationLabel,
  sessionEndTime,
  sessionStartTime,
} from '@/lib/conference-lineup';
import { conferenceDisplayFont } from '@/lib/conference-fonts';
import type { ConferenceSponsor } from '@/types/conference';

const EASE = [0.22, 1, 0.36, 1] as const;
const INTRO_MS = 5000;
const OUTRO_MS = 5000;
const DEMO_COUNTDOWN_MS = 15000;
// Admin changes (speaker order, sponsors) reach open screens within this interval
const LIVE_POLL_MS = 5000;

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

function Headline({ lines, size, align = 'left' }: { lines: string[]; size: string; align?: 'left' | 'center' }) {
  return (
    <h1
      className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.92] tracking-wide text-white ${align === 'center' ? 'text-center' : ''}`}
      style={{ fontSize: size }}
    >
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className="block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: EASE }}
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
      transition={{ duration: 0.8, delay: 0.4 }}
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
      {sponsors.map((sp) => {
        const local = SPONSOR_LOGOS.find((l) => l.match.test(sp.name))?.src;
        return (
          <div key={sp.id || sp.name} className="flex items-center justify-center w-full" style={{ height: cellHeight }}>
            {local ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={local} alt={sp.name} className="max-h-full max-w-full object-contain opacity-90" style={{ filter: 'brightness(0) invert(1)' }} />
            ) : (
              // Unknown sponsor: show its uploaded logo on a white tile so it stays legible
              <div className="bg-white rounded-[0.3vw] h-full flex items-center" style={{ padding: '0.3vw 0.5vw' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sp.logoUrl} alt={sp.name} className="max-h-full w-auto object-contain" />
              </div>
            )}
          </div>
        );
      })}
      </div>
    </motion.div>
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.05 + index * 0.08, ease: EASE, layout: { duration: 0.6, ease: EASE } }}
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

function UpNextBar({ next, remaining }: { next: LineupSession[]; remaining: number | null }) {
  if (next.length === 0 || remaining === null) return null;
  return (
    <motion.div
      className="flex items-stretch bg-[#001426]/90 border-t-[0.25vw] border-[#FFCB05]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
    >
      <div className="bg-[#FFCB05] text-[#00274c] flex flex-col justify-center" style={{ padding: '1vw 2vw', minWidth: '17vw' }}>
        <div className="font-extrabold uppercase" style={{ fontSize: '0.85vw', letterSpacing: '0.2em' }}>
          {remaining > 0 ? 'Up next in' : 'Starting now'}
        </div>
        <div className={`${conferenceDisplayFont.className} font-extrabold tabular-nums leading-none`} style={{ fontSize: '3.2vw' }}>
          {clockText(remaining)}
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
}

// Title above the speakers, date and location below, sponsors in the top-right corner
function PanelSlide({ session, next, remaining, sponsors }: SlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0" style={{ padding: '2.6vw 5vw 1.6vw' }}>
          <div className="flex items-start justify-between" style={{ gap: '3vw' }}>
            <HostedBy />
            <SponsorLogos sponsors={sponsors} columns={3} compact />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: '1.6vw' }}>
            <div className="flex flex-col items-center">
              <Eyebrow session={session} />
              <div style={{ marginTop: '0.8vw' }}>
                <Headline lines={session.headline} size={session.speakers.length >= 5 ? '3.6vw' : '4vw'} align="center" />
              </div>
            </div>

            <div className="flex justify-center items-end" style={{ gap: '1vw' }}>
              {session.speakers.map((sp, i) => (
                <FlyerCard key={sp.name} speaker={sp} index={i} count={session.speakers.length} />
              ))}
            </div>

            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
            >
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
            </motion.div>
          </div>
        </div>

      </div>
      <UpNextBar next={next} remaining={remaining} />
    </div>
  );
}

// Sessions without speakers (registration, coffee chats, closing): a "happening now" screen
function HappeningNowSlide({ session, next, remaining, now, sponsors, demo }: SlideProps) {
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

  const tiles = [
    { label: 'Where', value: session.room, sub: CONFERENCE_VENUE },
    { label: 'When', value: `${session.start} – ${session.end}`, sub: sessionDurationLabel(session) },
  ];

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0" style={{ padding: '2.6vw 5vw 2vw' }}>
        <HostedBy />

        <div className="flex-1 grid items-center" style={{ gridTemplateColumns: '1.35fr 1fr', gap: '4vw' }}>
          <div>
            <motion.div
              className="inline-flex items-center rounded-full border border-[#FFCB05]/50 bg-[#FFCB05]/10"
              style={{ gap: '0.6vw', padding: '0.4vw 1vw' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="relative flex" style={{ width: '0.7vw', height: '0.7vw' }}>
                {status === 'live' && <span className="absolute inset-0 rounded-full bg-[#FFCB05] animate-ping opacity-70" />}
                <span className="relative rounded-full bg-[#FFCB05] w-full h-full" />
              </span>
              <span className="font-extrabold uppercase text-[#FFCB05]" style={{ fontSize: '0.95vw', letterSpacing: '0.25em' }}>
                {status === 'before' ? 'Coming up' : status === 'after' ? 'Just wrapped' : 'Happening now'}
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
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                {session.description}
              </motion.p>
            )}
          </div>

          <motion.div
            className="flex flex-col"
            style={{ gap: '1vw' }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
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
          </motion.div>
        </div>

        <div className="flex justify-end">
          <SponsorLogos sponsors={sponsors} />
        </div>
      </div>
      <UpNextBar next={next} remaining={remaining} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intro and outro (5 seconds each)
// ─────────────────────────────────────────────────────────────────────────────

function TransitionScreen({ kicker, session, mode }: { kicker: string; session: LineupSession; mode: 'intro' | 'outro' }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 overflow-hidden bg-[#00274c] flex items-center justify-center"
      initial={mode === 'intro' ? { y: 0 } : { y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <FloatingShapes variant="dense" opacity={0.08} />

      {/* Maize stripes sweeping across */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute -skew-x-12 bg-[#FFCB05]"
          style={{ top: `${18 + i * 26}%`, height: i === 1 ? '1.2vw' : '0.5vw', width: '70vw', opacity: i === 1 ? 1 : 0.5 }}
          initial={{ x: '-120vw' }}
          animate={{ x: '140vw' }}
          transition={{ duration: 1.6, delay: (mode === 'outro' ? 0.3 : 0) + i * 0.15, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}

      <div className="relative text-center" style={{ padding: '0 8vw' }}>
        <motion.div
          className="inline-flex items-center"
          style={{ gap: '1vw' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
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
          transition={{ duration: 0.9, delay: 1.3, ease: EASE }}
        >
          {kicker}
        </motion.div>

        <h2
          className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.92] text-white`}
          style={{ fontSize: session.speakers.length > 0 ? '4.8vw' : '6vw', marginTop: '1.2vw' }}
        >
          {session.headline.map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 1.7 + i * 0.15, ease: EASE }}
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
          transition={{ duration: 0.9, delay: 2.3, ease: EASE }}
        />

        <motion.div
          className="text-white/80 font-bold uppercase"
          style={{ fontSize: '1.4vw', letterSpacing: '0.12em', marginTop: '1.4vw' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
        >
          {session.start} · {session.room}
        </motion.div>

        {/* Speakers pop in one after another */}
        {session.speakers.length > 0 && (
          <div className="flex justify-center items-start" style={{ gap: '1.4vw', marginTop: '2.2vw' }}>
            {session.speakers.map((sp, i) => (
              <motion.div
                key={sp.name}
                className="flex flex-col items-center"
                style={{ width: '9vw' }}
                initial={{ opacity: 0, scale: 0.3, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 2.5 + i * 0.12 }}
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
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One session's stage screen
// ─────────────────────────────────────────────────────────────────────────────

function StageScreen({
  session,
  demo,
  skipIntro,
  order,
  sponsors,
  onAdvance,
}: {
  session: LineupSession;
  demo: boolean;
  skipIntro: boolean;
  order: OrderMap;
  sponsors: ConferenceSponsor[];
  onAdvance: (next: LineupSession) => void;
}) {
  // Coming from an outro, the "Up next" screen already introduced this session, so go straight to it
  const [phase, setPhase] = useState<'intro' | 'live' | 'outro'>(skipIntro ? 'live' : 'intro');
  // Memoized so the hand-off timers aren't reset by every clock tick
  const nextSessions = useMemo(() => nextSessionsAfter(session), [session]);
  const [target] = useState<number | null>(() =>
    nextSessions.length === 0 ? null : demo ? Date.now() + DEMO_COUNTDOWN_MS : sessionStartTime(nextSessions[0]).getTime()
  );
  const now = useNow();
  const remaining = target === null || now === null ? null : Math.max(0, target - now);

  useEffect(() => {
    if (phase !== 'intro') return;
    const timer = setTimeout(() => setPhase('live'), INTRO_MS - 800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Only hand off if the countdown actually ran out while this screen was up (a screen opened late stays put)
  const sawTimeLeft = useRef(false);
  useEffect(() => {
    if (remaining === null) return;
    if (remaining > 0) {
      sawTimeLeft.current = true;
      return;
    }
    if (sawTimeLeft.current && phase === 'live' && nextSessions[0]) setPhase('outro');
  }, [remaining, phase, nextSessions]);

  useEffect(() => {
    if (phase !== 'outro' || !nextSessions[0]) return;
    const timer = setTimeout(() => onAdvance(nextSessions[0]), OUTRO_MS);
    return () => clearTimeout(timer);
  }, [phase, nextSessions, onAdvance]);

  const ordered = applySpeakerOrder(session, order[session.id]);
  const orderedNext = nextSessions.map((s) => applySpeakerOrder(s, order[s.id]));
  const Slide = session.speakers.length > 0 ? PanelSlide : HappeningNowSlide;

  return (
    <>
      {phase !== 'intro' && <Slide session={ordered} next={orderedNext} remaining={remaining} now={now} sponsors={sponsors} demo={demo} />}
      <AnimatePresence>
        {phase === 'intro' && <TransitionScreen key="intro" mode="intro" kicker={session.label || 'Now'} session={ordered} />}
        {phase === 'outro' && orderedNext[0] && <TransitionScreen key="outro" mode="outro" kicker="Up next" session={orderedNext[0]} />}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ConferenceBackgroundClient({
  sessionId,
  demo = false,
  skipIntro = false,
}: {
  sessionId?: string;
  demo?: boolean;
  skipIntro?: boolean;
}) {
  const router = useRouter();
  const index = CONFERENCE_LINEUP.findIndex((s) => s.id === sessionId);
  const session = index >= 0 ? CONFERENCE_LINEUP[index] : null;
  const [cursorHidden, setCursorHidden] = useState(false);
  const [order, setOrder] = useState<OrderMap>({});
  const [sponsors, setSponsors] = useState<ConferenceSponsor[]>([]);

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
        .catch(() => {});
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
    (next: LineupSession) => router.replace(`/conference/background?s=${next.id}${demo ? '&demo=1' : ''}&from=outro`),
    [router, demo]
  );

  // Arrow keys step through sessions; the cursor hides when idle so it doesn't sit on the projector
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
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
  }, [session, index, demo, router]);

  if (!session) {
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
          <div className="mt-8 space-y-3">
            {CONFERENCE_LINEUP.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="w-24 text-sm font-bold text-[#FFCB05]">{s.start}</div>
                <div className="flex-1 min-w-[200px] font-semibold">{plainTitle(s)}</div>
                <div className="flex gap-2">
                  <Link
                    href={`/conference/background?s=${s.id}`}
                    className="rounded-lg bg-[#FFCB05]/15 border border-[#FFCB05]/50 text-[#FFCB05] px-3 py-1.5 text-xs font-bold hover:bg-[#FFCB05]/25"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/conference/background?s=${s.id}&demo=1`}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold hover:border-white/50"
                  >
                    Rehearse
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-gradient-to-br from-[#00274c] via-[#00264a] to-[#001a33] text-white ${cursorHidden ? 'cursor-none' : ''}`}
    >
      <FloatingShapes variant="dense" opacity={0.08} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,203,5,0.08),transparent_55%)] pointer-events-none" />
      <StageScreen
        key={`${session.id}-${demo}`}
        session={session}
        demo={demo}
        skipIntro={skipIntro}
        order={order}
        sponsors={sponsors}
        onAdvance={onAdvance}
      />
    </div>
  );
}
