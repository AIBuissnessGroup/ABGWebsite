'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  TicketIcon, 
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { FaLinkedin } from 'react-icons/fa';
import FloatingShapes from '@/components/FloatingShapes';
import Footer from '@/components/Footer';
import { ConferenceData, ConferenceSpeaker, ConferenceScheduleItem, ConferenceSponsor } from '@/types/conference';
import { DEFAULT_CONFERENCE_DATA } from '@/lib/conference-defaults';
import { isAdmin } from '@/lib/roles';
import ConferenceTicketSection from '@/components/conference/ConferenceTicketSection';

/**
 * 3D Interactive Speaker Card with Flip Effect on Hover & Touch
 */
function ConferenceSpeakerCard({ speaker, index }: { speaker: ConferenceSpeaker; index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative w-full h-[410px] perspective-1000 cursor-pointer select-none"
      onClick={() => setIsFlipped((prev) => !prev)}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Speaker card for ${speaker.name}. Hover or tap to view bio.`}
    >
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ── FRONT FACE ──────────────────────────────────────────────────────── */}
        <div className="absolute inset-0 w-full h-full backface-hidden flex flex-col justify-between bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/15 group-hover:border-orange-500/50 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 shadow-xl group-hover:shadow-2xl group-hover:shadow-orange-950/30">
          <div>
            {/* Photo Container */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3.5 bg-gradient-to-br from-[#00274c] to-[#00172e] border border-white/20 shadow-inner flex items-center justify-center">
              {speaker.photoUrl ? (
                <img
                  src={speaker.photoUrl}
                  alt={speaker.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.avatar-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}

              {/* Initials Fallback */}
              <div
                className={`avatar-fallback w-full h-full flex items-center justify-center text-white/80 font-black text-2xl ${
                  speaker.photoUrl ? 'hidden' : ''
                }`}
              >
                {speaker.name
                  ? speaker.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'AI'}
              </div>

              {/* Speaker Index Badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-bold border border-white/10">
                #{index + 1}
              </span>

              {/* LinkedIn badge on front */}
              {speaker.linkedinUrl && (
                <a
                  href={speaker.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-[#0077b5] text-white/90 hover:text-white backdrop-blur-sm transition-colors duration-200 shadow-md"
                  title="LinkedIn Profile"
                >
                  <FaLinkedin className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Speaker Info */}
            <div className="text-center">
              <h3 className="font-extrabold text-base lg:text-lg text-white group-hover:text-orange-300 transition-colors duration-200 line-clamp-1">
                {speaker.name}
              </h3>
              <p className="text-xs font-semibold text-[#FF6700] mt-1 line-clamp-1">
                {speaker.role}
              </p>
              <div className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-bold border border-white/10 line-clamp-1">
                {speaker.company}
              </div>
            </div>
          </div>

          {/* Bottom Flip Cue */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/60 group-hover:text-orange-400 transition-colors">
            <ArrowPathIcon className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span>Hover for Bio</span>
          </div>
        </div>

        {/* ── BACK FACE (FLIPPED REVEALING BIO) ────────────────────────────────── */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl p-5 bg-gradient-to-b from-[#002855] via-[#001c38] to-[#001026] border-2 border-orange-500/60 backdrop-blur-xl shadow-2xl shadow-orange-950/50 flex flex-col justify-between overflow-hidden text-left">
          {/* Top Speaker Details */}
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#00172e] border border-orange-500/40 flex-shrink-0 flex items-center justify-center shadow-inner">
                {speaker.photoUrl ? (
                  <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-black">
                    {speaker.name ? speaker.name.charAt(0) : 'S'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-white truncate leading-tight">
                  {speaker.name}
                </h4>
                <p className="text-[11px] text-[#FF6700] font-semibold truncate mt-0.5">
                  {speaker.role}
                </p>
                <p className="text-[10px] text-white/60 truncate font-medium">
                  {speaker.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-400/90 py-1 border-y border-white/10">
              <SparklesIcon className="w-3 h-3 text-[#FF6700]" />
              <span>Speaker Bio</span>
            </div>
          </div>

          {/* Middle Bio Section with Smooth Scroll */}
          <div className="my-auto py-2.5 overflow-y-auto max-h-[175px] pr-1.5 text-xs text-white/90 leading-relaxed font-normal">
            {speaker.bio ? (
              <p className="whitespace-pre-line">{speaker.bio}</p>
            ) : (
              <p className="text-white/50 italic">
                Speaker bio to be announced soon. Check back closer to the conference.
              </p>
            )}
          </div>

          {/* Bottom Footer / LinkedIn Button */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            {speaker.linkedinUrl ? (
              <a
                href={speaker.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2 px-3 rounded-xl bg-[#0077b5]/30 hover:bg-[#0077b5] text-white border border-[#0077b5]/50 flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 shadow-sm"
              >
                <FaLinkedin className="w-3.5 h-3.5" />
                <span>LinkedIn Profile</span>
                <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-80" />
              </a>
            ) : (
              <div className="text-center text-[11px] font-medium text-white/70 py-1">
                {speaker.company}
              </div>
            )}
            <div className="text-center text-[10px] text-white/40 flex items-center justify-center gap-1">
              <ArrowPathIcon className="w-2.5 h-2.5 opacity-60" />
              <span>Hover off to flip</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ConferencePageClient() {
  const { data: session } = useSession();
  const [data, setData] = useState<ConferenceData>(DEFAULT_CONFERENCE_DATA);
  const [loading, setLoading] = useState(true);
  const userIsAdmin = isAdmin(session?.user?.roles || []);

  // Pre-expand sponsor list so the moving track has ample cards to span wide viewports
  const sponsorSingleSet = useMemo(() => {
    const rawSponsors = data.sponsors || [];
    if (rawSponsors.length === 0) return [];
    const repeatCount = Math.max(1, Math.ceil(8 / rawSponsors.length));
    return Array.from({ length: repeatCount }, () => rawSponsors).flat();
  }, [data.sponsors]);

  // Sort speakers strictly by their order property
  const sortedSpeakers = useMemo(() => {
    return [...(data.speakers || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [data.speakers]);

  // Clean description to ensure business strategy is removed
  const conferenceDescription = useMemo(() => {
    if (!data.description) return '';
    return data.description
      .replace('across finance, venture capital, and business strategy', 'across finance and venture capital')
      .replace(', and business strategy', ' and venture capital');
  }, [data.description]);

  useEffect(() => {
    fetch('/api/conference')
      .then((res) => res.json())
      .then((resData) => {
        if (resData && !resData.error) {
          setData(resData);
        }
      })
      .catch((err) => console.error('Failed to load conference data:', err))
      .finally(() => setLoading(false));
  }, []);

  // If page is toggled off (invisible) and user is not admin, show unlisted notice
  if (!loading && !data.isVisible && !userIsAdmin) {
    return (
      <div className="min-h-screen bg-[#00274c] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <FloatingShapes variant="dense" opacity={0.06} />
        <div className="max-w-lg w-full bg-white/5 border border-white/15 backdrop-blur-xl rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-[#FF6700] flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Conference Coming Soon</h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8">
            The {data.title} page is currently private while we finalize speakers and schedule details. Please check back soon!
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all duration-300"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001e3b] text-white selection:bg-[#FF6700] selection:text-white">
      {/* Admin Preview Mode Alert Banner if hidden */}
      {!data.isVisible && userIsAdmin && (
        <div className="bg-amber-500/90 text-gray-950 font-bold px-4 py-2 text-center text-xs sm:text-sm flex items-center justify-center gap-2 sticky top-16 z-40 shadow-md">
          <EyeSlashIcon className="w-4 h-4" />
          <span>Admin Preview Mode: This page is currently set to HIDDEN in the admin portal.</span>
          <Link href="/admin/conference" className="underline hover:text-black ml-2">
            Open Admin Controls
          </Link>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO / TITLE SECTION (Faded Background Image)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Faded Background Image with Multi-layer Gradient Overlays */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('${data.backgroundImageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#00274c]/90 via-[#00274c]/85 to-[#001e3b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,103,0,0.18)_0%,transparent_70%)] pointer-events-none" />

        {/* Floating Shapes Animation */}
        <FloatingShapes variant="dense" opacity={0.07} />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          {/* Host & Date Badges */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-orange-400/30 backdrop-blur-md shadow-lg shadow-orange-500/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6700] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-orange-200">
              {data.badgeText || "University of Michigan • AI Business Group Special Event"}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-md max-w-4xl"
          >
            <span className="bg-gradient-to-r from-white via-white to-orange-100 bg-clip-text text-transparent">
              {data.title}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl font-medium leading-relaxed"
          >
            {data.subtitle}
          </motion.p>

          {/* Event Quick Logistics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base font-semibold text-white/90 bg-white/10 backdrop-blur-md border border-white/15 px-6 py-3 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-2 text-orange-300">
              <CalendarIcon className="w-5 h-5 text-[#FF6700]" />
              <span>{data.eventDate}</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="flex items-center gap-2 text-white/90">
              <MapPinIcon className="w-5 h-5 text-[#FF6700]" />
              <span>{data.location}</span>
            </div>
          </motion.div>

          {/* Featured Participating Companies: Bank of America, JP Morgan, Microsoft */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-6 flex flex-col items-center justify-center gap-2.5"
          >
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/70">
              Featuring Speakers & Representation From
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <div className="h-11 sm:h-12 px-4 sm:px-5 py-2 rounded-xl bg-white/95 hover:bg-white backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                <img
                  src="/images/conference/logos/bank-of-america.svg"
                  alt="Bank of America"
                  className="h-4 sm:h-5 w-auto object-contain"
                />
              </div>

              <div className="h-11 sm:h-12 px-4 sm:px-5 py-2 rounded-xl bg-white/95 hover:bg-white backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                <img
                  src="/images/conference/logos/jpmorgan.svg"
                  alt="JP Morgan"
                  className="h-4 sm:h-5 w-auto object-contain"
                />
              </div>

              <div className="h-11 sm:h-12 px-4 sm:px-5 py-2 rounded-xl bg-white/95 hover:bg-white backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                <img
                  src="/images/conference/logos/microsoft.svg"
                  alt="Microsoft"
                  className="h-4 sm:h-5 w-auto object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <a
              href="#tickets"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF6700] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6700] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-orange-600/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-orange-400/40"
            >
              <TicketIcon className="w-5 h-5" />
              <span>{data.ticketButtonText || "Buy Tickets"}</span>
              <ChevronDownIcon className="w-4 h-4 opacity-80" />
            </a>

            <a
              href={data.learnMoreButtonUrl || "#about"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base sm:text-lg backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg"
            >
              <span>{data.learnMoreButtonText || "Learn More"}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Scroll down prompt */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center text-white/50 text-xs"
        >
          <span className="mb-1 uppercase tracking-widest text-[10px]">Scroll Down</span>
          <ChevronDownIcon className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. EVENT DESCRIPTION & KEY PILLARS
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Main Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[#FF6700] text-xs font-extrabold uppercase tracking-wider">
              <SparklesIcon className="w-4 h-4" />
              <span>About The Conference</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              Shaping the Intersection of <span className="text-[#FF6700]">AI & Business</span>
            </h2>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#FF6700] to-transparent rounded-full" />

            {/* Provided prompt description text */}
            <p className="text-base sm:text-lg lg:text-xl text-white/85 leading-relaxed font-normal">
              {conferenceDescription || data.description}
            </p>

            {/* Key stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl sm:text-4xl font-black text-[#FF6700]">300+</div>
                <div className="text-xs sm:text-sm text-white/70 font-semibold mt-1">Attendees & Leaders</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl sm:text-4xl font-black text-white">Full Day</div>
                <div className="text-xs sm:text-sm text-white/70 font-semibold mt-1">Ross School of Business</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm col-span-2 sm:col-span-1">
                <div className="text-3xl sm:text-4xl font-black text-orange-400">2 Key Tracks</div>
                <div className="text-xs sm:text-sm text-white/70 font-semibold mt-1">Finance & VC</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Feature Pillars */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 grid grid-cols-1 gap-4"
          >
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-lg hover:border-orange-500/40 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-[#FF6700] flex items-center justify-center mb-4 border border-orange-500/30">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Finance & Quantitative Strategy</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Insights from institutional leaders at firms like JP Morgan and Goldman Sachs on AI portfolio modeling, algorithmic risk, and banking operations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-lg hover:border-orange-500/40 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30">
                <BuildingOffice2Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Venture Capital & Innovation</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Direct dialog with top venture capitalists evaluating early-stage foundation models, AI agents, and enterprise commercialization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-lg hover:border-orange-500/40 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Coffee Chats & High-Impact Networking</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Intimate small-group coffee chats and interactive networking connecting students and faculty with founders and senior executives.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2.5. TICKETS & PASSES SECTION
      ────────────────────────────────────────────────────────────────────────────── */}
      <ConferenceTicketSection />

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. SPEAKERS SECTION (5 cards in a row on standard laptop screen)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="speakers" className="py-20 bg-[#00172e] border-y border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[#FF6700] text-xs font-extrabold uppercase tracking-wider mb-4">
              <UserGroupIcon className="w-4 h-4" />
              <span>Distinguished Lineup</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {data.speakersTitle || "Featured Speakers & Panelists"}
            </h2>
            <p className="mt-4 text-white/70 text-base sm:text-lg">
              {data.speakersDescription || "Keynote speakers and expert panelists from world-leading financial institutions, venture firms, and academia."}
            </p>
          </div>

          {/* 5 cards in a row on laptop/desktop: lg:grid-cols-5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
            {sortedSpeakers && sortedSpeakers.length > 0 ? (
              sortedSpeakers.map((speaker, index) => (
                <ConferenceSpeakerCard key={speaker.id || index} speaker={speaker} index={index} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-white/60">
                Speaker lineup will be announced soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. SCHEDULE SECTION (To be specified / customized)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="schedule" className="py-20 lg:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[#FF6700] text-xs font-extrabold uppercase tracking-wider mb-4">
            <ClockIcon className="w-4 h-4" />
            <span>Event Itinerary</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            {data.scheduleTitle || "Event Schedule"}
          </h2>
          <p className="mt-4 text-white/70 text-base sm:text-lg">
            {data.scheduleDescription || "Detailed session times, keynote presentations, and breakout opportunities throughout the day."}
          </p>
        </div>

        {/* Schedule timeline items */}
        <div className="space-y-4">
          {data.schedule && data.schedule.length > 0 ? (
            data.schedule.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-orange-500/30 backdrop-blur-sm transition-all duration-200"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Time Badge */}
                  <div className="flex-shrink-0 min-w-[140px] px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF6700] text-xs sm:text-sm font-black flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>{item.time}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-white">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-white/60 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {item.location && (
                  <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-white/70 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 self-start sm:self-center">
                    <MapPinIcon className="w-3.5 h-3.5 text-[#FF6700]" />
                    <span>{item.location}</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-white/70">
              Schedule details will be updated as speakers and panels are confirmed.
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. SPONSORS SECTION & BECOME A SPONSOR
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="sponsors" className="py-20 bg-[#00172e] border-t border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[#FF6700] text-xs font-extrabold uppercase tracking-wider mb-4">
              <BuildingOffice2Icon className="w-4 h-4" />
              <span>Partnership & Support</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {data.sponsorsTitle || "Our Sponsors & Partners"}
            </h2>
            <p className="mt-4 text-white/70 text-base sm:text-lg">
              {data.sponsorsDescription || "Generously supported by prominent organizations advancing AI research, innovation, and leadership."}
            </p>
          </div>
        </div>

        {/* Animated Sponsor Cards Line (Moving Left to Right) */}
        {sponsorSingleSet.length > 0 ? (
          <div className="relative w-full overflow-hidden mb-16 py-4">
            {/* Left gradient fade mask */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-[#00172e] via-[#00172e]/90 to-transparent z-10" />

            {/* Right gradient fade mask */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-[#00172e] via-[#00172e]/90 to-transparent z-10" />

            {/* Infinite Marquee Track: Translates from -50% to 0% continuously to move left-to-right */}
            <div className="animate-marquee-ltr py-2 flex w-max">
              {/* Set A */}
              <div className="flex gap-6 pr-6 flex-shrink-0">
                {sponsorSingleSet.map((sponsor, idx) => (
                  <div
                    key={`sponsor-a-${sponsor.id || idx}-${idx}`}
                    className="w-72 sm:w-80 flex-shrink-0 p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-orange-500/40 hover:bg-white/[0.08] backdrop-blur-sm flex flex-col items-center justify-center text-center group transition-all duration-300 shadow-lg hover:shadow-orange-500/10 select-none"
                  >
                    <div className="h-20 w-full flex items-center justify-center mb-4 px-4">
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="max-h-16 max-w-full object-contain filter brightness-95 group-hover:brightness-110 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fb = target.parentElement?.querySelector('.sponsor-fallback');
                            if (fb) fb.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`sponsor-fallback text-lg font-bold text-white/80 ${sponsor.logoUrl ? 'hidden' : ''}`}>
                        {sponsor.name}
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-[#FF6700] transition-colors">
                      {sponsor.name}
                    </h3>
                    <span className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-[#FF6700]">
                      {sponsor.tier} Partner
                    </span>

                    {sponsor.websiteUrl && (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors group-hover:text-white/80"
                      >
                        <span>Visit Site</span>
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Set B (Identical duplicate for seamless infinite looping) */}
              <div className="flex gap-6 pr-6 flex-shrink-0" aria-hidden="true">
                {sponsorSingleSet.map((sponsor, idx) => (
                  <div
                    key={`sponsor-b-${sponsor.id || idx}-${idx}`}
                    className="w-72 sm:w-80 flex-shrink-0 p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-orange-500/40 hover:bg-white/[0.08] backdrop-blur-sm flex flex-col items-center justify-center text-center group transition-all duration-300 shadow-lg hover:shadow-orange-500/10 select-none"
                  >
                    <div className="h-20 w-full flex items-center justify-center mb-4 px-4">
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="max-h-16 max-w-full object-contain filter brightness-95 group-hover:brightness-110 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fb = target.parentElement?.querySelector('.sponsor-fallback');
                            if (fb) fb.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`sponsor-fallback text-lg font-bold text-white/80 ${sponsor.logoUrl ? 'hidden' : ''}`}>
                        {sponsor.name}
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-[#FF6700] transition-colors">
                      {sponsor.name}
                    </h3>
                    <span className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-[#FF6700]">
                      {sponsor.tier} Partner
                    </span>

                    {sponsor.websiteUrl && (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors group-hover:text-white/80"
                      >
                        <span>Visit Site</span>
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Become a Sponsor Callout Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-orange-950/40 via-orange-900/20 to-blue-950/40 border border-orange-500/30 backdrop-blur-lg shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF6700]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Interested in Sponsoring the Conference?
              </h3>
              <p className="mt-4 text-white/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Connect your brand with 300+ students, top researchers, and corporate decision-makers at the University of Michigan's premier AI event. Sponsorship tiers include keynote visibility, booth activations, and direct recruiting access.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={data.sponsorButtonUrl || "mailto:ABGContact@umich.edu?subject=Michigan%20AI%20Business%20Conference%20Sponsorship"}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FF6700] hover:bg-[#FF7700] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-orange-600/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all duration-300 border border-orange-400/30"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>{data.sponsorButtonText || "Become a Sponsor"}</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
