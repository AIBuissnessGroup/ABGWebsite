'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import FloatingShapes from './FloatingShapes';

type StoryMoment = {
  id: string;
  navLabel: string;
  kicker: string;
  title: string;
  description: string;
  takeawayLabel: string;
  takeaway: string;
  tagLabel?: string;
  tags?: string[];
  mediaStyle: 'balanced' | 'feature-top' | 'cinematic';
  images: Array<{ src: string; alt: string; caption?: string }>;
};

const featuredPanelCompanies = ['Dell', 'Amazon', 'Microsoft', 'Walmart', 'IBM'];
const expandedNetworkingCompanies = ['Apple', 'AMD', 'Accenture', 'LinkedIn', 'ESPN', 'NFL', 'PwC', 'Disney'];
const heroCredibilityItems = ['SXSW 2026'];
const teaserBullets = [
  'Panels featuring Dell, Amazon, Microsoft, Walmart, and IBM.',
  'An ABG-led AI workshop on better AI usage and prompting.',
  'Michigan alumni networking with Apple and AMD, followed by broader brand touchpoints.',
];
const impactStats = [
  { value: '3', label: 'Innovative panels hosted by ABG' },
  { value: '1', label: 'ABG-led AI workshop' },
  { value: '300,000+', label: 'People in attendance at SXSW' },
  { value: '300+', label: 'Available events for ABG members' },
];
const companyLogos = [
  { src: '/images/SXSW-ReCap/Company-Logos/dell-com-logo.png', alt: 'Dell' },
  { src: '/images/SXSW-ReCap/Company-Logos/amazonwebservices-com-logo.png', alt: 'Amazon' },
  { src: '/images/SXSW-ReCap/Company-Logos/microsoft-com-logo.png', alt: 'Microsoft' },
  { src: '/images/SXSW-ReCap/Company-Logos/wal-mart-com-logo.png', alt: 'Walmart' },
  { src: '/images/SXSW-ReCap/Company-Logos/ibm-com-logo.png', alt: 'IBM' },
  { src: '/images/SXSW-ReCap/Company-Logos/apple-com-logo.png', alt: 'Apple' },
  { src: '/images/SXSW-ReCap/Company-Logos/amd-com-logo.png', alt: 'AMD' },
  { src: '/images/SXSW-ReCap/Company-Logos/espn-com-logo.png', alt: 'ESPN' },
  { src: '/images/SXSW-ReCap/Company-Logos/nfl-com-logo.png', alt: 'NFL' },
  { src: '/images/SXSW-ReCap/Company-Logos/disney-com-logo.png', alt: 'Disney' },
  { src: '/images/SXSW-ReCap/Company-Logos/logo.svg', alt: 'LinkedIn' },
  { src: '/images/SXSW-ReCap/Company-Logos/logo (1).svg', alt: 'Accenture' },
  { src: '/images/SXSW-ReCap/Company-Logos/logo (2).svg', alt: 'PwC' },
];
const revealIn = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.65, ease: 'easeOut' },
};

const revealOnLoad = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: 'easeOut' },
};

const recapStoryMoments: StoryMoment[] = [
  {
    id: 'sxsw-panels',
    navLabel: 'Panels',
    kicker: 'Scene 01',
    title: 'Panels on AI and Innovation',
    description:
      'ABG represented the University of Michigan by convening panels on how AI will shape innovation and business impact. The conversations put student leaders in the room with operators from major organizations and kept the discussion focused on practical adoption.',
    takeawayLabel: 'Outcome',
    takeaway:
      'From strategy to execution, ABG positioned student leaders inside conversations about practical AI adoption with measurable business relevance.',
    tagLabel: 'Featured panel companies',
    tags: featuredPanelCompanies,
    mediaStyle: 'balanced',
    images: [
      {
        src: '/images/SXSW-ReCap/1773955625175.jpg',
        alt: 'Panel and audience engagement during ABG programming at SXSW 2026.',
        caption: 'ABG-led panels brought campus talent into high-signal conversations about AI and business.',
      },
      {
        src: '/images/SXSW-ReCap/IMG_6939.JPG',
        alt: 'ABG speakers and guests sharing AI perspectives in Austin.',
      },
    ],
  },
  {
    id: 'sxsw-workshop',
    navLabel: 'Workshop',
    kicker: 'Scene 02',
    title: 'Workshop on Better AI Usage and Prompting',
    description:
      'ABG also led a workshop on better AI usage and prompting, sharing research-backed methods teams can use to improve output quality, judgment, and decision confidence. The session turned ABG research into an immediately useful framework for attendees.',
    takeawayLabel: 'Takeaway',
    takeaway: 'ABG translated prompting research into a repeatable framework attendees could apply right away.',
    mediaStyle: 'feature-top',
    images: [
      {
        src: '/images/SXSW-ReCap/1773955624332.jpg',
        alt: 'AI Business Group members gathering with attendees at SXSW 2026.',
        caption: 'The workshop reinforced ABG as a group that can both research and teach practical AI methods.',
      },
    ],
  },
  {
    id: 'sxsw-alumni-mixer',
    navLabel: 'Alumni Mixer',
    kicker: 'Scene 03',
    title: 'Michigan Alumni Networking',
    description:
      'After the hosted programming, ABG held a Michigan alumni networking event that connected students with recent graduates working at Apple and AMD. The room turned SXSW visibility into direct, actionable access for members thinking about the next step in tech and business.',
    takeawayLabel: 'Why it mattered',
    takeaway: 'The mixer converted event presence into real access for students and recent graduates in the field.',
    tagLabel: 'Michigan alumni touchpoints',
    tags: ['Apple', 'AMD'],
    mediaStyle: 'balanced',
    images: [
      {
        src: '/images/SXSW-ReCap/IMG_6912.JPG',
        alt: 'Highlights from networking moments across SXSW events.',
        caption: 'ABG kept the experience personal by creating direct alumni access, not just stage visibility.',
      },
      {
        src: '/images/SXSW-ReCap/videoframe_1753.png',
        alt: 'ABG members connecting with professionals at SXSW 2026.',
      },
    ],
  },
  {
    id: 'sxsw-extended-network',
    navLabel: 'Extended Network',
    kicker: 'Scene 04',
    title: 'Expanded SXSW Connections',
    description:
      'Members kept building momentum across SXSW by joining sessions, side conversations, and additional workshops tied to Accenture, LinkedIn, ESPN, NFL, PwC, and Disney. The result was broader exposure, stronger context, and more ways for students to see where they can contribute.',
    takeawayLabel: 'Extended reach',
    takeaway:
      'ABG used SXSW as a platform for repeated relationship-building across tech, media, consulting, and entertainment.',
    tagLabel: 'Additional brand touchpoints',
    tags: expandedNetworkingCompanies,
    mediaStyle: 'cinematic',
    images: [
      {
        src: '/images/SXSW-ReCap/IMG_4563.JPG',
        alt: 'Scenes from AI Business Group activities at SXSW 2026.',
        caption: 'The experience stretched beyond official programming into a broader network of rooms, sessions, and follow-on conversations.',
      },
      {
        src: '/images/SXSW-ReCap/IMG_0041.JPG',
        alt: 'University of Michigan representation by AI Business Group in Austin.',
      },
      {
        src: '/images/SXSW-ReCap/IMG_0047.JPG',
        alt: 'ABG recap photo from SXSW 2026 events and engagements.',
      },
    ],
  },
];

function LogoMarqueeRow({ logos, direction }: { logos: Array<{ src: string; alt: string }>; direction: 'left' | 'right' }) {
  const doubled = [...logos, ...logos];
  const totalWidth = logos.length * 96; // 84px tile + 12px gap
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#08192b] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#08192b] to-transparent" />
      <motion.div
        className="flex gap-3"
        animate={{ x: direction === 'left' ? [0, -totalWidth] : [-totalWidth, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((logo, i) => (
          <div
            key={`${logo.alt}-${i}`}
            className="flex h-[50px] w-[84px] flex-shrink-0 items-center justify-center rounded-xl bg-white/92 px-2.5 py-2 shadow-sm"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={64}
              height={36}
              className="h-auto max-h-8 w-auto max-w-[60px] object-contain"
              unoptimized
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-7 w-7 translate-x-[1px]">
      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.85l8.12-5.18a1 1 0 0 0 0-1.7L9.54 5.97A1 1 0 0 0 8 6.82Z" />
    </svg>
  );
}

const logoSizeOverrides: Record<string, string> = {
  dell: 'max-h-9 max-w-[64px]',
};

function CompanyLogoPill({ label, index = 0 }: { label: string; index?: number }) {
  const logo = companyLogos.find((l) => l.alt.toLowerCase() === label.toLowerCase());
  if (!logo) return <CompanyPill label={label} />;
  const sizeClass = logoSizeOverrides[label.toLowerCase()] ?? 'max-h-7 max-w-[52px]';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
      whileHover={{ scale: 1.08, transition: { duration: 0.18 } }}
      className="flex h-[44px] w-[76px] flex-shrink-0 items-center justify-center rounded-xl border border-[#60a5fa]/25 bg-white/92 px-2 py-1.5 shadow-sm cursor-default"
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={64}
        height={40}
        className={`h-auto w-auto object-contain ${sizeClass}`}
        unoptimized
      />
    </motion.div>
  );
}

function CompanyPill({ label, prominent = false }: { label: string; prominent?: boolean }) {
  return (
    <span
      className={[
        'rounded-full border px-3 py-1.5 text-xs sm:text-sm transition-colors',
        prominent
          ? 'border-[#9bd6ff]/55 bg-[#dff4ff] text-[#001b36]'
          : 'border-[#60a5fa]/35 bg-[#0f2843]/78 text-[#e5f5ff] hover:border-[#8fd1ff]/55 hover:bg-[#15385e]/85',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function StoryImage({
  src,
  alt,
  sizes,
  className,
  caption,
  objectPosition,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className: string;
  caption?: string;
  objectPosition?: string;
  priority?: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[1.35rem] border border-white/15 bg-white/5 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        style={objectPosition ? { objectPosition } : undefined}
        priority={priority}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#03111d]/62 via-[#03111d]/16 to-transparent" />
      {caption && (
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-[#eef9ff]">{caption}</p>
        </div>
      )}
    </div>
  );
}

function renderStoryMedia(moment: StoryMoment, chapterIndex: number) {
  if (moment.mediaStyle === 'feature-top') {
    return (
      <div className="grid gap-3 sm:gap-4">
        {moment.images[0] && (
          <StoryImage
            src={moment.images[0].src}
            alt={moment.images[0].alt}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-72 sm:h-80"
            caption={moment.images[0].caption}
            priority={chapterIndex === 0}
          />
        )}
        {moment.images[1] && (
          <StoryImage
            src={moment.images[1].src}
            alt={moment.images[1].alt}
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="h-48 sm:h-56"
          />
        )}
      </div>
    );
  }

  if (moment.mediaStyle === 'cinematic') {
    return (
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[0.72fr,1fr]">
        <div className="grid gap-3 sm:gap-4">
          {moment.images[0] && (
            <StoryImage
              src={moment.images[0].src}
              alt={moment.images[0].alt}
              sizes="(max-width: 1024px) 100vw, 24vw"
              className="h-64 sm:h-72"
              objectPosition="center 30%"
              caption={moment.images[0].caption}
            />
          )}
          {moment.images[1] && (
            <StoryImage
              src={moment.images[1].src}
              alt={moment.images[1].alt}
              sizes="(max-width: 1024px) 100vw, 24vw"
              className="h-64 sm:h-72"
            />
          )}
        </div>
        {moment.images[2] && (
          <StoryImage
            src={moment.images[2].src}
            alt={moment.images[2].alt}
            sizes="(max-width: 1024px) 100vw, 32vw"
            className="h-72 min-h-[18rem] sm:h-full"
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {moment.images.slice(0, 2).map((image, imageIndex) => (
        <StoryImage
          key={image.src}
          src={image.src}
          alt={image.alt}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          className="h-52 sm:h-64"
          caption={imageIndex === 0 ? image.caption : undefined}
          priority={chapterIndex === 0 && imageIndex === 0}
        />
      ))}
    </div>
  );
}

function renderChapterCard(
  moment: StoryMoment,
  index: number,
  activeChapter: string,
  setActiveChapter: (id: string) => void
) {
  const isActive = activeChapter === moment.id;
  const cardClassName = [
    'glass-card scroll-mt-28 border transition-colors duration-300',
    isActive ? 'border-[#8fd1ff]/60' : 'border-[#60a5fa]/30',
  ].join(' ');

  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8fd1ff]">{moment.kicker}</p>
        <span className="h-px w-10 bg-gradient-to-r from-[#8fd1ff]/80 to-transparent" />
      </div>
      <h3 className="heading-secondary text-xl text-white sm:text-2xl">{moment.title}</h3>
      <p className="max-w-prose text-sm leading-relaxed text-[#dbe8f4] sm:text-base">{moment.description}</p>
    </div>
  );

  const takeaway = (
    <div className="rounded-[1.1rem] border border-[#60a5fa]/35 bg-[#071a2d]/82 px-4 py-4">
      <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#9dd7ff]">{moment.takeawayLabel}</p>
      <p className="text-sm leading-relaxed text-[#eef8ff] sm:text-base">{moment.takeaway}</p>
    </div>
  );

  const tags = moment.tags ? (
    <div className="space-y-3">
      {moment.tagLabel && <p className="text-[11px] uppercase tracking-[0.16em] text-[#a8d8fb]">{moment.tagLabel}</p>}
      <div className="flex flex-wrap gap-2">
        {moment.tags.map((tag, i) => (
          <CompanyLogoPill key={tag} label={tag} index={i} />
        ))}
      </div>
    </div>
  ) : null;

  if (index === 0) {
    return (
      <motion.article
        id={moment.id}
        key={moment.id}
        onMouseEnter={() => setActiveChapter(moment.id)}
        onFocus={() => setActiveChapter(moment.id)}
        {...revealOnLoad}
        transition={{ ...revealOnLoad.transition, delay: 0.04 * index }}
        className={`${cardClassName} overflow-hidden bg-[#0d2137]/78`}
      >
        <div className="grid items-stretch lg:grid-cols-[0.95fr,1.05fr]">
          <div className="order-2 flex flex-col justify-between gap-6 p-5 sm:p-6 lg:order-1 lg:p-8">
            {header}
            {tags}
            {takeaway}
          </div>
          <div className="order-1 p-4 sm:p-5 lg:order-2 lg:p-6">{renderStoryMedia(moment, index)}</div>
        </div>
      </motion.article>
    );
  }

  if (index === 1) {
    return (
      <motion.article
        id={moment.id}
        key={moment.id}
        onMouseEnter={() => setActiveChapter(moment.id)}
        onFocus={() => setActiveChapter(moment.id)}
        {...revealOnLoad}
        transition={{ ...revealOnLoad.transition, delay: 0.04 * index }}
        className={`${cardClassName} bg-[#0d2035]/78 p-5 sm:p-6 lg:p-8`}
      >
        <div className="grid gap-5 lg:grid-cols-[1.08fr,0.92fr] lg:items-start">
          <div className="space-y-5">
            {header}
            {takeaway}
          </div>
          <div className="rounded-[1.5rem] border border-[#60a5fa]/18 bg-gradient-to-br from-[#12345b]/35 to-transparent p-3 sm:p-4">
            {renderStoryMedia(moment, index)}
          </div>
        </div>
      </motion.article>
    );
  }

  if (index === 2) {
    return (
      <motion.article
        id={moment.id}
        key={moment.id}
        onMouseEnter={() => setActiveChapter(moment.id)}
        onFocus={() => setActiveChapter(moment.id)}
        {...revealOnLoad}
        transition={{ ...revealOnLoad.transition, delay: 0.04 * index }}
        className={`${cardClassName} bg-[#10243a]/78 p-5 sm:p-6 lg:p-8`}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr,0.95fr] lg:items-stretch">
          <div className="space-y-5">
            {header}
            {tags}
            {takeaway}
          </div>
          <div>{renderStoryMedia(moment, index)}</div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      id={moment.id}
      key={moment.id}
      onMouseEnter={() => setActiveChapter(moment.id)}
      onFocus={() => setActiveChapter(moment.id)}
      {...revealOnLoad}
      transition={{ ...revealOnLoad.transition, delay: 0.04 * index }}
      className={`${cardClassName} bg-gradient-to-br from-[#10233a] via-[#0d1b2c] to-[#132d49] p-5 sm:p-6 lg:p-8`}
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr,1.08fr] lg:items-start">
        <div className="space-y-5">
          {header}
          {tags}
          {takeaway}
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-[#061528]/36 p-3 sm:p-4">{renderStoryMedia(moment, index)}</div>
      </div>
    </motion.article>
  );
}

export default function Highlights() {
  const [activeChapter, setActiveChapter] = useState(recapStoryMoments[0].id);

  return (
    <section
      className="relative min-h-screen overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-12 lg:pt-14"
      style={{
        background: 'linear-gradient(135deg, #061529 0%, #001933 48%, #0a2d4a 100%)',
      }}
    >
      <FloatingShapes variant="dense" opacity={0.04} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 10, 0], y: [0, -16, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-10 top-16 h-72 w-72 rounded-full bg-[#60a5fa]/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -8, 0], y: [0, 14, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-16 bottom-24 h-80 w-80 rounded-full bg-[#1d4ed8]/12 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="mb-10 grid gap-5 lg:mb-14 lg:grid-cols-[1.15fr,0.85fr] lg:items-stretch"
        >
          <div className="relative min-h-[30rem] overflow-hidden rounded-[2rem] border border-white/12 shadow-[0_30px_80px_rgba(0,0,0,0.38)] sm:min-h-[36rem] lg:min-h-[39rem]">
            <Image
              src="/images/SXSW-ReCap/IMG_9823.JPG"
              alt="AI Business Group members representing the University of Michigan at SXSW 2026."
              fill
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover object-[center_32%]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020d19]/28 via-[#020d19]/58 to-[#020d19]/94" />
            <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8 lg:p-10">
              <div className="rounded-[1.5rem] bg-[#03111d]/74 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-[2px] sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
                <div className="mb-4 inline-flex w-fit items-center rounded-full border border-white/16 bg-[#03111d]/72 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ecf8ff] backdrop-blur-sm">
                  ABG Highlights
                </div>
                <h1 className="heading-primary max-w-3xl text-4xl text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-6xl">
                  University of Michigan at SXSW 2026
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#f1f7fd] drop-shadow-[0_8px_22px_rgba(0,0,0,0.42)] sm:text-base lg:text-lg">
                  ABG brought panels, a workshop, and high-value networking to one of the biggest stages in tech and culture,
                  giving students real visibility alongside major companies and alumni in Austin, Texas.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {heroCredibilityItems.map((item) => (
                    <CompanyPill key={item} label={item} prominent />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card flex flex-col justify-between overflow-hidden rounded-[2rem] border border-[#60a5fa]/28 bg-[#08192b]/78 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-7 lg:p-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#98d6ff]">Featured Company Touchpoints</p>
                <p className="mt-3 text-sm leading-relaxed text-[#d7e7f5] sm:text-base">
                  The strongest credibility signals came from the rooms ABG earned access to, the companies in those rooms,
                  and the alumni and operators who turned SXSW into something more.
                </p>
              </div>

              <div className="space-y-3 overflow-hidden rounded-[1.25rem]">
                <LogoMarqueeRow logos={companyLogos} direction="left" />
                <LogoMarqueeRow logos={[...companyLogos].reverse()} direction="right" />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/recruitment" className="btn-primary text-center">
                Explore Recruitment
              </Link>
              <a
                href="#sxsw-video"
                className="inline-flex items-center justify-center rounded-full border border-[#60a5fa]/35 px-5 py-3 text-center text-sm font-semibold text-[#e5f5ff] transition hover:border-[#95d7ff]/55 hover:bg-[#12355a]/75"
              >
                See the SXSW Story
              </a>
            </div>
          </div>
        </motion.div>

        <div className="space-y-10 sm:space-y-12">
          <motion.div id="sxsw-video" {...revealOnLoad} className="scroll-mt-28">
            <div className="glass-card overflow-hidden rounded-[1.85rem] border border-[#60a5fa]/30 bg-[#0b1d31]/78">
              <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[26rem]">
                <Image
                  src="/images/SXSW-ReCap/1773955624332.jpg"
                  alt="Preview image for the ABG SXSW 2026 recap video."
                  fill
                  sizes="100vw"
                  className="object-cover object-[center_35%]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#020d19]/10 via-[#020d19]/36 to-[#020d19]/88" />
                <div className="absolute left-4 top-4 rounded-full border border-[#95d7ff]/45 bg-[#0a2138]/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#dff5ff] backdrop-blur-sm sm:left-5 sm:top-5">
                  In Production
                </div>
                <div className="absolute inset-0 flex items-center justify-center px-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    <PlayIcon />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="heading-secondary text-lg text-white sm:text-xl">Full SXSW Recap in Final Edit</p>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#dbe8f5] sm:text-base">
                    We are finishing the highlight reel now. Until then, the story below previews the panels, workshop,
                    and networking that defined ABG's week in Austin.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...revealOnLoad}>
            <div className="glass-card rounded-[1.85rem] border border-[#60a5fa]/30 bg-gradient-to-br from-[#112f52] via-[#0c1f33] to-[#08182a] p-6 sm:p-7 lg:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ad8ff]">SXSW Impact at a Glance</p>
              <h2 className="heading-secondary mt-3 text-2xl text-white sm:text-3xl">Why this trip mattered</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#d8e7f4] sm:text-base">
                ABG represented the University of Michigan through panels, an ABG-led AI workshop, alumni networking, and extended brand touchpoints.
                For prospective members, this is the signal: the group creates real exposure, real reps, and real access.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {impactStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.25rem] border border-[#8fd1ff]/18 bg-[#0a1c2f]/72 px-4 py-4 sm:px-5"
                  >
                    <p className="heading-primary text-3xl text-[#eff9ff] sm:text-4xl">{stat.value}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#bfe7ff]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.2rem] border border-[#60a5fa]/26 bg-[#071729]/78 px-4 py-4 sm:px-5">
                <p className="text-sm leading-relaxed text-[#eef7ff] sm:text-base">
                  ABG did not just attend SXSW. The group showed up as a credible campus organization with something to contribute, then turned that presence into recruiting value for future members.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div id="sxsw-story" {...revealOnLoad} className="scroll-mt-28 space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr,0.9fr] lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#98d6ff]">Editorial Recap</p>
                <h2 className="heading-secondary mt-3 text-2xl text-white sm:text-3xl">Inside ABG at SXSW</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#d7e6f3] sm:text-base">
                  A four-part story of how ABG showed up on stage, taught practical AI methods, created alumni access, and kept building relationships across the broader SXSW ecosystem.
                </p>
              </div>

            </div>

            <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-3">
                {recapStoryMoments.map((moment) => (
                  <a
                    key={moment.id}
                    href={`#${moment.id}`}
                    onClick={() => setActiveChapter(moment.id)}
                    className={[
                      'group rounded-[1.25rem] border px-4 py-3 transition-all sm:px-5 sm:py-4',
                      activeChapter === moment.id
                        ? 'border-[#9ad8ff]/55 bg-[#dff4ff] text-[#001b36] shadow-[0_10px_26px_rgba(96,165,250,0.22)]'
                        : 'border-[#60a5fa]/25 bg-[#0a1a2c]/76 text-[#e6f4ff] hover:border-[#9ad8ff]/45 hover:bg-[#12355a]/80',
                    ].join(' ')}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] opacity-75">{moment.kicker}</p>
                    <p className="mt-1 text-sm font-semibold sm:text-base">{moment.navLabel}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              {recapStoryMoments.map((moment, index) => renderChapterCard(moment, index, activeChapter, setActiveChapter))}
            </div>
          </motion.div>

          <motion.div
            {...revealIn}
            className="glass-card rounded-[1.85rem] border border-[#60a5fa]/35 bg-[#0d2137]/80 p-6 sm:p-8"
          >
            <div className="rounded-[1.55rem] border border-[#60a5fa]/45 bg-gradient-to-r from-[#143a60]/38 via-[#0e2b48]/44 to-[#0f4566]/28 p-5 text-center sm:p-6 lg:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-[#b8e7ff]">Next Chapter</p>
              <h2 className="heading-secondary mt-3 text-2xl text-white sm:text-3xl">Build moments like this with ABG</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#dff4ff] sm:text-base">
                If the appeal is real exposure, practical AI leadership, and access to rooms that matter, that is exactly the case for joining. ABG is building more of these moments next.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/recruitment" className="btn-primary text-center">
                  Explore Recruitment
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center rounded-full border border-[#9ad8ff]/40 px-5 py-3 text-center text-sm font-semibold text-[#eef8ff] transition hover:border-[#dff4ff]/65 hover:bg-[#15355a]/75"
                >
                  Explore Projects
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
