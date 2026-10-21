'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  CalendarIcon, 
  MapPinIcon, 
  TicketIcon, 
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import FloatingShapes from '@/components/FloatingShapes';
import Footer from '@/components/Footer';
import { ConferenceData } from '@/types/conference';
import { DEFAULT_CONFERENCE_DATA } from '@/lib/conference-defaults';
import { isAdmin } from '@/lib/roles';
import ConferenceTicketSection from '@/components/conference/ConferenceTicketSection';
import ConferenceSignInButton from '@/components/conference/ConferenceSignInButton';
import { useConferencePass } from '@/hooks/useConferencePass';
import ConferenceLineup from '@/components/conference/ConferenceLineup';

export default function ConferencePageClient() {
  const { data: session } = useSession();
  const [data, setData] = useState<ConferenceData>(DEFAULT_CONFERENCE_DATA);
  const [loading, setLoading] = useState(true);
  const userIsAdmin = isAdmin(session?.user?.roles || []);
  const pass = useConferencePass();

  // Pre-expand sponsor list so the moving track has ample cards to span wide viewports
  const sponsorSingleSet = useMemo(() => {
    const rawSponsors = data.sponsors || [];
    if (rawSponsors.length === 0) return [];
    const repeatCount = Math.max(1, Math.ceil(8 / rawSponsors.length));
    return Array.from({ length: repeatCount }, () => rawSponsors).flat();
  }, [data.sponsors]);

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
          <div className="w-16 h-16 rounded-2xl bg-[#FFCB05]/20 border border-[#FFCB05]/40 text-[#FFCB05] flex items-center justify-center mx-auto mb-6">
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
    <div className="min-h-screen bg-[#001e3b] text-white selection:bg-[#FFCB05] selection:text-[#00274c]">
      {/* Admin Preview Mode Alert Banner if hidden */}
      {!data.isVisible && userIsAdmin && (
        <div className="bg-[#FFCB05]/90 text-gray-950 font-bold px-4 py-2 text-center text-xs sm:text-sm flex items-center justify-center gap-2 sticky top-16 z-40 shadow-md">
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
      <section className="relative flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-28 overflow-hidden">
        {/* Faded Background Image with Multi-layer Gradient Overlays */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('${data.backgroundImageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#00274c]/90 via-[#00274c]/85 to-[#001e3b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,203,5,0.18)_0%,transparent_70%)] pointer-events-none" />

        {/* Floating Shapes Animation */}
        <FloatingShapes variant="dense" opacity={0.07} />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          {/* Host & Date Badges */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#FFD633]/30 backdrop-blur-md shadow-lg shadow-[#FFCB05]/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#FFCB05] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#FFEB99]">
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
            <span className="bg-gradient-to-r from-white via-white to-[#FFF5CC] bg-clip-text text-transparent">
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
            <div className="flex items-center gap-2 text-[#FFE066]">
              <CalendarIcon className="w-5 h-5 text-[#FFCB05]" />
              <span>{data.eventDate}</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="flex items-center gap-2 text-white/90">
              <MapPinIcon className="w-5 h-5 text-[#FFCB05]" />
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
            {pass.status === 'has-pass' ? (
              // Already holds a pass: point to it instead of selling another
              <a
                href={`/conference/success?ticket_id=${pass.ticket.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-emerald-300/30"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>You already have an active pass</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 opacity-80" />
              </a>
            ) : (
              <a
                href="#tickets"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FFCB05] to-[#F5B700] hover:from-[#FFD84D] hover:to-[#FFCB05] text-[#00274c] font-extrabold text-base sm:text-lg shadow-xl shadow-[#E6B700]/30 hover:shadow-[#FFCB05]/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-[#FFD633]/40"
              >
                <TicketIcon className="w-5 h-5" />
                <span>{data.ticketButtonText || "Buy Tickets"}</span>
                <ChevronDownIcon className="w-4 h-4 opacity-80" />
              </a>
            )}

            <a
              href={data.learnMoreButtonUrl || "#about"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base sm:text-lg backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg"
            >
              <span>{data.learnMoreButtonText || "Learn More"}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </a>
          </motion.div>

          {pass.status === 'signed-out' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-white/70"
            >
              <span>Already have a pass, or want faster checkout?</span>
              <ConferenceSignInButton className="px-5 py-2.5 text-sm" />
            </motion.div>
          )}
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
          1.5. SPEAKER LINEUP (session posters in agenda order)
      ────────────────────────────────────────────────────────────────────────────── */}
      <ConferenceLineup backgroundImageUrl={data.backgroundImageUrl} />

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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFCB05]/10 border border-[#FFCB05]/30 text-[#FFCB05] text-xs font-extrabold uppercase tracking-wider">
              <SparklesIcon className="w-4 h-4" />
              <span>About The Conference</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              Shaping the Intersection of <span className="text-[#FFCB05]">AI & Business</span>
            </h2>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#FFCB05] to-transparent rounded-full" />

            {/* Provided prompt description text */}
            <p className="text-base sm:text-lg lg:text-xl text-white/85 leading-relaxed font-normal">
              {conferenceDescription || data.description}
            </p>

            {/* Key stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl sm:text-4xl font-black text-[#FFCB05]">300+</div>
                <div className="text-xs sm:text-sm text-white/70 font-semibold mt-1">Attendees & Leaders</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl sm:text-4xl font-black text-white">Full Day</div>
                <div className="text-xs sm:text-sm text-white/70 font-semibold mt-1">Ross School of Business</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm col-span-2 sm:col-span-1">
                <div className="text-3xl sm:text-4xl font-black text-[#FFD633]">2 Key Tracks</div>
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
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-lg hover:border-[#FFCB05]/40 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-[#FFCB05]/20 text-[#FFCB05] flex items-center justify-center mb-4 border border-[#FFCB05]/30">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Finance & Quantitative Strategy</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Insights from institutional leaders at firms like JP Morgan and Goldman Sachs on AI portfolio modeling, algorithmic risk, and banking operations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-lg hover:border-[#FFCB05]/40 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30">
                <BuildingOffice2Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Venture Capital & Innovation</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Direct dialog with top venture capitalists evaluating early-stage foundation models, AI agents, and enterprise commercialization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-lg hover:border-[#FFCB05]/40 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-[#FFCB05]/20 text-[#FFD633] flex items-center justify-center mb-4 border border-[#FFCB05]/30">
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
      <ConferenceTicketSection pass={pass} />

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. SPONSORS SECTION & BECOME A SPONSOR
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="sponsors" className="py-20 bg-[#00172e] border-t border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFCB05]/10 border border-[#FFCB05]/30 text-[#FFCB05] text-xs font-extrabold uppercase tracking-wider mb-4">
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
                    className="w-72 sm:w-80 flex-shrink-0 p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#FFCB05]/40 hover:bg-white/[0.08] backdrop-blur-sm flex flex-col items-center justify-center text-center group transition-all duration-300 shadow-lg hover:shadow-[#FFCB05]/10 select-none"
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

                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-[#FFCB05] transition-colors">
                      {sponsor.name}
                    </h3>
                    <span className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-[#FFCB05]">
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
                    className="w-72 sm:w-80 flex-shrink-0 p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#FFCB05]/40 hover:bg-white/[0.08] backdrop-blur-sm flex flex-col items-center justify-center text-center group transition-all duration-300 shadow-lg hover:shadow-[#FFCB05]/10 select-none"
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

                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-[#FFCB05] transition-colors">
                      {sponsor.name}
                    </h3>
                    <span className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-[#FFCB05]">
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
            className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#2E2400]/40 via-[#4D3D00]/20 to-blue-950/40 border border-[#FFCB05]/30 backdrop-blur-lg shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFCB05]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Interested in Sponsoring the Conference?
              </h3>
              <p className="mt-4 text-white/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Connect your brand with 300+ students, top researchers, and corporate decision-makers at the University of Michigan&apos;s premier AI event. Sponsorship tiers include keynote visibility, booth activations, and direct recruiting access.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={data.sponsorButtonUrl || "mailto:ABGContact@umich.edu?subject=Michigan%20AI%20Business%20Conference%20Sponsorship"}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FFCB05] hover:bg-[#FFD84D] text-[#00274c] font-extrabold text-base sm:text-lg shadow-lg shadow-[#E6B700]/30 hover:shadow-[#FFCB05]/50 hover:scale-[1.02] transition-all duration-300 border border-[#FFD633]/30"
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
