'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  nextSessionsAfter,
  parseHeadline,
  sessionStartTime,
} from '@/lib/conference-lineup';
import { conferenceDisplayFont } from '@/lib/conference-fonts';

const EASE = [0.22, 1, 0.36, 1] as const;
const INTRO_MS = 5000;
const OUTRO_MS = 5000;
const DEMO_COUNTDOWN_MS = 15000;

const ROLE_LABEL: Record<LineupSpeaker['role'], string | null> = {
  speaker: null,
  moderator: 'Moderator',
  keynote: 'Keynote',
  host: null,
};

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

function Headline({ lines, style }: { lines: string[]; style?: React.CSSProperties }) {
  return (
    <h1 className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.92] tracking-wide text-white`} style={style}>
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className="block"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.12, ease: EASE }}
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
      style={{ padding: '0.35vw 0.6vw' }}
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

function SessionMeta({ session, align = 'left' }: { session: LineupSession; align?: 'left' | 'center' }) {
  return (
    <div
      className={`flex flex-wrap items-center text-white/85 font-bold ${align === 'center' ? 'justify-center' : ''}`}
      style={{ gap: '1.6vw', fontSize: '1.35vw' }}
    >
      <span className="text-[#FFCB05] uppercase font-extrabold">{CONFERENCE_DATE_LABEL}</span>
      <span>
        {session.start} – {session.end}
      </span>
      <span className="uppercase">{session.room}</span>
      <span className="text-white/55">{CONFERENCE_VENUE}</span>
    </div>
  );
}

function Eyebrow({ session }: { session: LineupSession }) {
  if (!session.label) return null;
  return (
    <span
      className="inline-block w-fit bg-[#FFCB05] text-[#00274c] font-extrabold uppercase rounded-[0.25vw]"
      style={{ fontSize: '1vw', padding: '0.3vw 0.8vw', letterSpacing: '0.15em' }}
    >
      {session.label}
    </span>
  );
}

function plainTitle(session: LineupSession) {
  return session.headline.join(' ').replace(/\*/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown to the next session
// ─────────────────────────────────────────────────────────────────────────────

function useCountdown(target: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (target === null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [target]);
  return target === null ? null : Math.max(0, target - now);
}

function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const units = [
    ...(d > 0 ? [{ label: 'Days', value: d }] : []),
    ...(d > 0 || h > 0 ? [{ label: 'Hrs', value: h }] : []),
    { label: 'Min', value: m },
    { label: 'Sec', value: s },
  ];
  return units;
}

function UpNextCard({ sessions, remaining }: { sessions: LineupSession[]; remaining: number }) {
  return (
    <motion.div
      className="rounded-[1vw] border border-[#FFCB05]/40 bg-[#001a33]/80 backdrop-blur-md shadow-2xl"
      style={{ width: '27vw', padding: '1.2vw 1.4vw' }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
    >
      <div className="flex items-center justify-between">
        <span className="font-extrabold uppercase text-[#FFCB05]" style={{ fontSize: '0.9vw', letterSpacing: '0.2em' }}>
          Up next · {sessions[0].start}
        </span>
        <span className="relative flex" style={{ width: '0.6vw', height: '0.6vw' }}>
          <span className="absolute inset-0 rounded-full bg-[#FFCB05] animate-ping opacity-60" />
          <span className="relative rounded-full bg-[#FFCB05] w-full h-full" />
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: '0.9vw', marginTop: '0.7vw' }}>
        {sessions.map((s) => (
          <div key={s.id}>
            <div className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.95] text-white`} style={{ fontSize: '1.7vw' }}>
              {s.headline.map((line, i) => (
                <span key={i} className="block">
                  <HeadlineText line={line} />
                </span>
              ))}
            </div>
            <div className="text-white/70 font-bold uppercase" style={{ fontSize: '0.8vw', letterSpacing: '0.08em', marginTop: '0.3vw' }}>
              {s.room}
            </div>
            {s.speakers.length > 0 && (
              <div className="flex items-center" style={{ gap: '0.6vw', marginTop: '0.5vw' }}>
                <div className="flex flex-shrink-0">
                  {s.speakers.map((sp, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={sp.name}
                      src={sp.photo}
                      alt={sp.name}
                      className="rounded-full object-cover grayscale border-[#001a33]"
                      style={{
                        width: '2.4vw',
                        height: '2.4vw',
                        borderWidth: '0.15vw',
                        marginLeft: i === 0 ? 0 : '-0.6vw',
                        objectPosition: sp.photoPosition || 'center 20%',
                      }}
                    />
                  ))}
                </div>
                <div className="text-white/85 leading-snug" style={{ fontSize: '0.8vw' }}>
                  {s.speakers
                    .map((sp) => (sp.role === 'moderator' ? `${sp.name} (moderator)` : sp.name))
                    .join(', ')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/15" style={{ marginTop: '1vw', paddingTop: '0.8vw' }}>
        <div className="uppercase font-bold text-white/55" style={{ fontSize: '0.75vw', letterSpacing: '0.2em' }}>
          {remaining > 0 ? 'Starts in' : 'Starting now'}
        </div>
        <div className="flex" style={{ gap: '0.5vw', marginTop: '0.4vw' }}>
          {formatCountdown(remaining).map((u) => (
            <div key={u.label} className="flex-1 text-center rounded-[0.5vw] bg-white/[0.07] border border-white/15" style={{ padding: '0.4vw 0' }}>
              <div className={`${conferenceDisplayFont.className} font-extrabold text-[#FFCB05] tabular-nums leading-none`} style={{ fontSize: '2.4vw' }}>
                {String(u.value).padStart(2, '0')}
              </div>
              <div className="uppercase text-white/55 font-bold" style={{ fontSize: '0.6vw', letterSpacing: '0.15em', marginTop: '0.2vw' }}>
                {u.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flyer slide — slanted portrait cards, like the printed flyers
// ─────────────────────────────────────────────────────────────────────────────

function FlyerCard({ speaker, index, count }: { speaker: LineupSpeaker; index: number; count: number }) {
  const width = count >= 5 ? 11.5 : count >= 3 ? 13.5 : count === 2 ? 15 : 16;
  const height = width * 1.45 + (count > 2 && index % 2 === 1 ? 2 : 0);
  const bar = count > 1 ? (index === 0 ? 'left' : index === count - 1 ? 'right' : null) : null;
  const role = ROLE_LABEL[speaker.role];

  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ width: `${width}vw`, height: `${height}vw` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1 + index * 0.1, ease: EASE }}
    >
      <div className="absolute inset-0 -skew-x-12">
        {bar && (
          <motion.div
            className={`absolute bg-[#FFCB05] -z-10 ${bar === 'left' ? 'origin-left' : 'origin-right'}`}
            style={{ top: '-1.2vw', [bar]: '-1.4vw', width: '70%', height: '46%' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.4 + index * 0.1, ease: EASE }}
          />
        )}
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
          <div className="absolute skew-x-12" style={{ top: '0.8vw', right: '1vw' }}>
            <Logo speaker={speaker} height="1.1vw" />
          </div>
        )}
        <div className="absolute skew-x-12" style={{ left: '1.2vw', right: '0.8vw', bottom: '1vw' }}>
          {role && (
            <div className="inline-block bg-[#FFCB05] text-[#00274c] font-extrabold uppercase" style={{ fontSize: '0.75vw', padding: '0.15vw 0.5vw', marginBottom: '0.4vw' }}>
              {role}
            </div>
          )}
          <div className="font-bold text-white leading-tight border-b-white w-fit" style={{ fontSize: '1.2vw', paddingBottom: '0.3vw', borderBottomWidth: '0.15vw' }}>
            {speaker.name}
          </div>
          <div className="text-white/80 leading-snug" style={{ fontSize: '0.8vw', marginTop: '0.35vw' }}>
            {speaker.title}
            {speaker.company ? `, ${speaker.company}` : ''}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FlyerSlide({ session, upNext }: { session: LineupSession; upNext: React.ReactNode }) {
  return (
    <div className="relative h-full w-full flex flex-col" style={{ padding: '3vw 5vw' }}>
      <HostedBy />
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="flex justify-center items-end" style={{ gap: '1.1vw' }}>
          {session.speakers.map((sp, i) => (
            <FlyerCard key={sp.name} speaker={sp} index={i} count={session.speakers.length} />
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between" style={{ gap: '3vw' }}>
        <div className="min-w-0" style={{ maxWidth: upNext ? '58vw' : undefined }}>
          <Eyebrow session={session} />
          <Headline lines={session.headline} style={{ fontSize: session.speakers.length >= 5 ? '4.2vw' : '4.8vw', marginTop: '1vw' }} />
          <motion.div
            className="bg-white"
            style={{ height: '0.25vw', marginTop: '1.2vw', marginBottom: '1.2vw' }}
            initial={{ width: 0 }}
            animate={{ width: '45%' }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
          />
          <SessionMeta session={session} />
        </div>
        {upNext}
      </div>
    </div>
  );
}

// Sessions without speakers (registration, coffee chats, closing) get a simple title slide
function LogisticsSlide({ session, upNext }: { session: LineupSession; upNext: React.ReactNode }) {
  return (
    <div className="relative h-full w-full flex flex-col" style={{ padding: '3vw 5vw' }}>
      <HostedBy />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Headline lines={[session.headline[0]]} style={{ fontSize: '6vw' }} />
        {session.description && (
          <motion.p
            className="text-white/75 max-w-[60vw]"
            style={{ fontSize: '1.6vw', marginTop: '2vw' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {session.description}
          </motion.p>
        )}
        <div style={{ marginTop: '2.5vw' }}>
          <SessionMeta session={session} align="center" />
        </div>
      </div>
      {upNext && <div className="flex justify-end">{upNext}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intro and outro (5 seconds each)
// ─────────────────────────────────────────────────────────────────────────────

function TransitionScreen({
  kicker,
  session,
  mode,
}: {
  kicker: string;
  session: LineupSession;
  mode: 'intro' | 'outro';
}) {
  const enterFrom = mode === 'intro' ? 0 : 1;
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
          transition={{ duration: 1.6, delay: 0.15 * enterFrom + i * 0.15, ease: [0.65, 0, 0.35, 1] }}
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
            <span className="block text-white/55">{CONFERENCE_DATE_LABEL} · {CONFERENCE_VENUE}</span>
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

function StageScreen({ session, demo }: { session: LineupSession; demo: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'live' | 'outro'>('intro');
  // Memoized so the outro timer isn't reset by every countdown tick
  const nextSessions = useMemo(() => nextSessionsAfter(session), [session]);

  // Demo mode counts down from 15 seconds so the outro can be rehearsed
  const [target] = useState<number | null>(() =>
    nextSessions.length === 0 ? null : demo ? Date.now() + DEMO_COUNTDOWN_MS : sessionStartTime(nextSessions[0]).getTime()
  );
  const remaining = useCountdown(target);

  // Only hand off to the next session if the countdown actually ran out while this screen was up
  const sawTimeLeft = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setPhase((p) => (p === 'intro' ? 'live' : p)), INTRO_MS - 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining > 0) {
      sawTimeLeft.current = true;
      return;
    }
    if (sawTimeLeft.current && phase !== 'outro') setPhase('outro');
  }, [remaining, phase]);

  useEffect(() => {
    if (phase !== 'outro' || nextSessions.length === 0) return;
    const timer = setTimeout(() => {
      router.replace(`/conference/background?s=${nextSessions[0].id}${demo ? '&demo=1' : ''}`);
    }, OUTRO_MS);
    return () => clearTimeout(timer);
  }, [phase, nextSessions, demo, router]);

  const upNext =
    nextSessions.length > 0 && remaining !== null ? <UpNextCard sessions={nextSessions} remaining={remaining} /> : null;
  const Slide = session.speakers.length === 0 ? LogisticsSlide : FlyerSlide;

  return (
    <>
      {phase !== 'intro' && <Slide session={session} upNext={upNext} />}
      <AnimatePresence>
        {phase === 'intro' && <TransitionScreen key="intro" mode="intro" kicker={session.label || 'Now'} session={session} />}
        {phase === 'outro' && nextSessions[0] && (
          <TransitionScreen key="outro" mode="outro" kicker="Up next" session={nextSessions[0]} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ConferenceBackgroundClient({ sessionId, demo = false }: { sessionId?: string; demo?: boolean }) {
  const router = useRouter();
  const index = CONFERENCE_LINEUP.findIndex((s) => s.id === sessionId);
  const session = index >= 0 ? CONFERENCE_LINEUP[index] : null;
  const [cursorHidden, setCursorHidden] = useState(false);

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
            that session automatically. Arrow keys switch sessions manually. &ldquo;Rehearse&rdquo; runs a 15-second countdown so you can
            preview the transitions.
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
      <StageScreen key={`${session.id}-${demo}`} session={session} demo={demo} />
    </div>
  );
}
