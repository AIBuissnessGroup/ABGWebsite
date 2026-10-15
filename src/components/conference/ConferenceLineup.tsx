'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, ClockIcon, MapPinIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import {
  CONFERENCE_DATE_LABEL,
  CONFERENCE_LINEUP,
  CONFERENCE_VENUE,
  LINEUP_SPEAKER_COUNT,
  SPEAKER_SESSIONS,
  LineupSession,
  LineupSpeaker,
  parseHeadline,
} from '@/lib/conference-lineup';
import { conferenceDisplayFont } from '@/lib/conference-fonts';

const EASE = [0.22, 1, 0.36, 1] as const;

const ROLE_TAG: Record<LineupSpeaker['role'], string | null> = {
  speaker: null,
  moderator: 'Moderator',
  keynote: 'Keynote',
  host: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared pieces
// ─────────────────────────────────────────────────────────────────────────────

export function SessionHeadline({
  lines,
  className = '',
  animate = true,
}: {
  lines: string[];
  className?: string;
  animate?: boolean;
}) {
  // The trigger sits on the heading: the lines start clipped, so they can't be observed themselves
  return (
    <motion.h3
      className={`${conferenceDisplayFont.className} font-extrabold uppercase leading-[0.92] tracking-wide text-white ${className}`}
      initial={animate ? 'hidden' : false}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.12, delayChildren: 0.15 }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.04em]">
          <motion.span
            className="block"
            variants={{ hidden: { y: '105%' }, show: { y: 0 } }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {parseHeadline(line).map((seg, j) => (
              <span key={j} className={seg.maize ? 'text-[#FFCB05]' : undefined}>
                {seg.text}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </motion.h3>
  );
}

function LogoBadge({ speaker, className = '' }: { speaker: LineupSpeaker; className?: string }) {
  if (!speaker.logo) return null;
  return (
    <div
      className={`rounded-[3px] px-1.5 py-1 shadow-sm flex items-center ${
        speaker.logo.src ? 'bg-white/95' : 'bg-[#00274c] border border-[#FFCB05]/60'
      } ${className}`}
    >
      {speaker.logo.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={speaker.logo.src} alt={speaker.logo.alt} className="h-2.5 sm:h-3.5 w-auto max-w-[72px] sm:max-w-[96px] object-contain" />
      ) : (
        <span className="block max-w-[64px] sm:max-w-[96px] text-right text-[7px] sm:text-[9px] font-extrabold uppercase tracking-wide text-white leading-[1.15]">
          {speaker.logo.text || speaker.logo.alt}
        </span>
      )}
    </div>
  );
}

type FaceSize = 'lg' | 'md' | 'sm' | 'xs';

const FACE_SIZES: Record<FaceSize, { box: string; tall: string; name: string; title: string }> = {
  lg: {
    box: 'w-[90px] h-[136px] sm:w-[128px] sm:h-[190px] lg:w-[150px] lg:h-[222px] xl:w-[166px] xl:h-[244px]',
    tall: 'w-[90px] h-[150px] sm:w-[128px] sm:h-[208px] lg:w-[150px] lg:h-[246px] xl:w-[166px] xl:h-[272px]',
    name: 'text-[11px] sm:text-[13px] lg:text-sm',
    title: 'text-[9px] sm:text-[10px] lg:text-[11px]',
  },
  md: {
    box: 'w-[92px] h-[136px] sm:w-[118px] sm:h-[172px]',
    tall: 'w-[92px] h-[148px] sm:w-[118px] sm:h-[188px]',
    name: 'text-[10px] sm:text-xs',
    title: 'text-[9px] sm:text-[10px]',
  },
  xs: {
    box: 'w-[60px] h-[88px] sm:w-[70px] sm:h-[102px]',
    tall: 'w-[60px] h-[88px] sm:w-[70px] sm:h-[102px]',
    name: 'text-[8px] sm:text-[9px]',
    title: 'hidden',
  },
  sm: {
    box: 'w-[84px] h-[124px] sm:w-[100px] sm:h-[148px]',
    tall: 'w-[84px] h-[124px] sm:w-[100px] sm:h-[148px]',
    name: 'text-[10px] sm:text-[11px]',
    title: 'text-[9px]',
  },
};

// Slanted black-and-white portrait card from the event flyers
export function FaceCard({
  speaker,
  index = 0,
  size = 'lg',
  tall = false,
  bar,
  showTitle = true,
}: {
  speaker: LineupSpeaker;
  index?: number;
  size?: FaceSize;
  tall?: boolean;
  bar?: 'left' | 'right';
  showTitle?: boolean;
}) {
  const sizes = FACE_SIZES[size];
  const tag = ROLE_TAG[speaker.role];

  return (
    <motion.div
      className={`group relative flex-shrink-0 ${tall ? sizes.tall : sizes.box}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.09, ease: EASE }}
      whileHover={{ y: -6 }}
    >
      <div className="absolute inset-0 -skew-x-12">
      {/* Maize accent bar behind the outer cards */}
      {bar && size !== 'xs' && (
        <motion.div
          className={`absolute -top-3 sm:-top-4 h-[46%] w-[70%] bg-[#FFCB05] -z-10 ${
            bar === 'left' ? '-left-3 sm:-left-4 origin-left' : '-right-3 sm:-right-4 origin-right'
          }`}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.25 + index * 0.09, ease: EASE }}
        />
      )}

      <div className="absolute inset-0 overflow-hidden border-2 border-white/85 bg-[#8d97a3] transition-colors duration-300 group-hover:border-[#FFCB05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={speaker.photo}
          alt={speaker.name}
          loading="lazy"
          className="absolute top-0 -left-1/4 h-full w-[150%] max-w-none skew-x-12 object-cover grayscale contrast-105 transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
          style={{ objectPosition: speaker.photoPosition || 'center 20%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-[#00274c]/95" />
      </div>

      {speaker.logo && size !== 'xs' && (
        <div className="absolute top-1.5 right-2 sm:top-2.5 sm:right-3 skew-x-12">
          <LogoBadge speaker={speaker} />
        </div>
      )}


      <div className="absolute left-2.5 right-2 bottom-2 sm:left-3.5 sm:bottom-3 skew-x-12">
        {tag && size !== 'xs' && (
          <div className="inline-block mb-1 bg-[#FFCB05] text-[#00274c] text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 leading-none">
            {tag}
          </div>
        )}
        <div className={`${sizes.name} font-bold text-white leading-tight pb-1 border-b-2 border-white block w-fit min-w-[70%]`}>
          {speaker.name}
        </div>
        {showTitle && (
          <div className={`${sizes.title} text-white/80 mt-1 leading-snug line-clamp-3`}>
            {speaker.title}
            {speaker.company ? `, ${speaker.company}` : ''}
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
}

export function FaceRow({
  speakers,
  size = 'lg',
  showTitle = true,
  wrap = true,
  className = '',
}: {
  speakers: LineupSpeaker[];
  size?: FaceSize;
  showTitle?: boolean;
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex ${wrap ? 'flex-wrap' : 'flex-nowrap'} justify-center items-end gap-x-2 gap-y-6 sm:gap-x-3 ${className}`}>
      {speakers.map((sp, i) => (
        <FaceCard
          key={sp.name}
          speaker={sp}
          index={i}
          size={size}
          tall={speakers.length > 2 && i % 2 === 1}
          bar={speakers.length > 1 && i === 0 ? 'left' : speakers.length > 1 && i === speakers.length - 1 ? 'right' : undefined}
          showTitle={showTitle}
        />
      ))}
    </div>
  );
}

function Eyebrow({ session }: { session: LineupSession }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FFCB05]">
      {session.label && <span className="bg-[#FFCB05] text-[#00274c] px-2 py-0.5 rounded-[3px] tracking-wider">{session.label}</span>}
      <span>
        {session.start} · {session.room}
      </span>
    </div>
  );
}

function InfoRow({ session }: { session: LineupSession }) {
  return (
    <motion.div
      className="mt-5 flex items-end justify-between gap-6"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <div className="font-extrabold uppercase text-[#FFCB05] text-base sm:text-xl leading-tight">
        {CONFERENCE_DATE_LABEL}
        <span className="block text-white normal-case text-sm sm:text-base font-bold mt-0.5">
          {session.start} – {session.end}
        </span>
      </div>
      <div className="font-extrabold uppercase text-[#FFCB05] text-base sm:text-xl leading-tight text-right">
        {session.room}
        <span className="block text-white normal-case text-sm sm:text-base font-bold mt-0.5">{CONFERENCE_VENUE}</span>
      </div>
    </motion.div>
  );
}

function AnimatedRule() {
  return (
    <motion.div
      className="h-[3px] bg-white mt-4"
      initial={{ width: 0 }}
      whileInView={{ width: '55%' }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session layouts
// ─────────────────────────────────────────────────────────────────────────────

function SessionDetails({ session }: { session: LineupSession }) {
  const [open, setOpen] = useState(false);
  if (!session.description) return null;

  return (
    <div className="mt-6 border-t border-white/15 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm font-bold text-white/85 hover:text-[#FFCB05] transition-colors"
      >
        {open ? 'Hide details' : 'About this panel'}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="inline-flex">
          <ChevronDownIcon className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-white/80">{session.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelPoster({ session, backgroundImageUrl }: { session: LineupSession; backgroundImageUrl?: string }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
      {backgroundImageUrl && (
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00274c]/90 via-[#00274c]/85 to-[#001e3b]/95" />

      <div className="relative px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <Eyebrow session={session} />
        <FaceRow speakers={session.speakers} className="mt-8 sm:mt-10" />
        <SessionHeadline lines={session.headline} className="mt-8 text-[40px] sm:text-6xl lg:text-7xl" />
        <AnimatedRule />
        <InfoRow session={session} />
        <SessionDetails session={session} />
      </div>
    </article>
  );
}

function KeynotePoster({ session, backgroundImageUrl }: { session: LineupSession; backgroundImageUrl?: string }) {
  const [keynote, ...others] = session.speakers;
  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
      {backgroundImageUrl && (
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00274c]/92 via-[#00274c]/85 to-[#001e3b]/95" />

      <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div>
          <div className="flex items-center gap-3">
            <Eyebrow session={session} />
            {keynote?.logo?.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={keynote.logo.src} alt={keynote.logo.alt} className="h-4 w-auto bg-white rounded-[3px] px-1.5 py-0.5" />
            )}
          </div>
          <SessionHeadline lines={session.headline} className="mt-6 text-[40px] sm:text-6xl lg:text-[64px]" />
          <AnimatedRule />
          <InfoRow session={session} />
        </div>

        {/* Large portraits with maize name chips, as on the keynote flyer */}
        <div className="relative h-[300px] sm:h-[380px] max-w-[480px] w-full mx-auto">
          {[keynote, ...others].map((sp, i) => (
            <motion.div
              key={sp.name}
              className={`group absolute bottom-0 overflow-hidden rounded-lg ${
                i === 0 ? 'left-0 w-[58%] h-full z-10' : 'right-0 w-[48%] h-[82%]'
              }`}
              initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.15, ease: EASE }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sp.photo}
                alt={sp.name}
                loading="lazy"
                className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105 [mask-image:linear-gradient(180deg,#000_62%,transparent)]"
                style={{ objectPosition: sp.photoPosition || 'center 20%' }}
              />
            </motion.div>
          ))}

          {[keynote, ...others].map((sp, i) => (
            <motion.div
              key={`${sp.name}-chip`}
              className={`absolute z-20 bg-[#FFCB05] text-[#00274c] rounded-xl px-3 py-2 shadow-xl max-w-[62%] ${
                i === 0 ? 'left-0 bottom-6' : 'right-0 bottom-20 text-right'
              }`}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15, ease: EASE }}
            >
              <div className="text-sm sm:text-base font-extrabold leading-tight">{sp.name}</div>
              <div className="text-[10px] sm:text-[11px] font-medium leading-snug">
                {sp.title}
                {sp.company ? ` · ${sp.company}` : ''}
              </div>
              <div className="mt-1 pt-1 border-t border-[#00274c]/30 text-xs sm:text-sm font-extrabold uppercase">
                {ROLE_TAG[sp.role] || 'Speaker'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </article>
  );
}

function TalkCard({ session }: { session: LineupSession }) {
  const solo = session.speakers.length === 1;
  return (
    <motion.article
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-5 py-6 sm:px-7 sm:py-7 h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <Eyebrow session={session} />
      <div className={`mt-5 flex gap-5 ${solo ? 'flex-row items-center' : 'flex-col'}`}>
        <FaceRow speakers={session.speakers} size={solo ? 'sm' : 'md'} wrap={false} className="!justify-start pl-3 flex-shrink-0" />
        <div className="min-w-0">
          <SessionHeadline lines={session.headline} className={solo ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-[#FFCB05]" />
              {session.start} – {session.end}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4 text-[#FFCB05]" />
              {session.room}
            </span>
          </div>
        </div>
      </div>
      {session.showDescriptionOnCard && session.description && (
        <p className="mt-5 text-sm leading-relaxed text-white/75">{session.description}</p>
      )}
    </motion.article>
  );
}

function LogisticsRow({ session }: { session: LineupSession }) {
  return (
    <motion.div
      className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03]"
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className={`${conferenceDisplayFont.className} font-bold text-lg sm:text-xl text-[#FFCB05] w-[88px] sm:w-[110px] flex-shrink-0`}>
        {session.start}
      </div>
      <div className="flex-1 min-w-0 text-sm sm:text-base font-semibold text-white/90">{session.headline[0]}</div>
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 flex-shrink-0">
        <MapPinIcon className="w-3.5 h-3.5" />
        {session.room}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full lineup (the /conference page centerpiece)
// ─────────────────────────────────────────────────────────────────────────────

export default function ConferenceLineup({ backgroundImageUrl }: { backgroundImageUrl?: string }) {
  const rendered = new Set<string>();

  return (
    <section id="lineup" className="relative pt-4 pb-20 lg:pt-6 lg:pb-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFCB05]/10 border border-[#FFCB05]/30 text-[#FFCB05] text-xs font-extrabold uppercase tracking-wider mb-4">
            <MicrophoneIcon className="w-4 h-4" />
            <span>The Lineup</span>
          </div>
          <h2 className={`${conferenceDisplayFont.className} text-5xl sm:text-6xl lg:text-7xl font-extrabold uppercase text-white leading-none`}>
            Speakers <span className="text-[#FFCB05]">&amp;</span> Sessions
          </h2>
          <p className="mt-4 text-white/70 text-base sm:text-lg">
            {LINEUP_SPEAKER_COUNT} speakers across {SPEAKER_SESSIONS.length} sessions · {CONFERENCE_DATE_LABEL} at {CONFERENCE_VENUE}
          </p>
        </motion.div>

        <div className="space-y-6 sm:space-y-8">
          {CONFERENCE_LINEUP.map((session) => {
            if (rendered.has(session.id)) return null;
            rendered.add(session.id);

            if (session.kind === 'logistics') return <LogisticsRow key={session.id} session={session} />;
            if (session.kind === 'panel') return <PanelPoster key={session.id} session={session} backgroundImageUrl={backgroundImageUrl} />;
            if (session.kind === 'keynote') return <KeynotePoster key={session.id} session={session} backgroundImageUrl={backgroundImageUrl} />;

            const partner = session.concurrentWith && CONFERENCE_LINEUP.find((s) => s.id === session.concurrentWith);
            if (partner) {
              rendered.add(partner.id);
              return (
                <div key={session.id}>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50 mb-3 text-center">
                    Concurrent sessions · {session.start}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <TalkCard session={session} />
                    <TalkCard session={partner} />
                  </div>
                </div>
              );
            }
            return <TalkCard key={session.id} session={session} />;
          })}
        </div>
      </div>
    </section>
  );
}
