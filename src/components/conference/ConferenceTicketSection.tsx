'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TicketIcon, 
  SparklesIcon, 
  CheckIcon, 
  ClockIcon, 
  XMarkIcon,
  ShieldCheckIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { TicketPricingStatus, ConferenceTicket } from '@/types/conference-ticket';
import { getConferenceTicketStatus } from '@/lib/conference-pricing';

export default function ConferenceTicketSection() {
  const { data: session } = useSession();
  const [pricing, setPricing] = useState<TicketPricingStatus>(getConferenceTicketStatus());
  const [existingTicket, setExistingTicket] = useState<ConferenceTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    affiliation: 'umich_student',
    dietaryRestrictions: '',
  });

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Sync user session data if available
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || '',
        email: prev.email || session.user?.email || '',
      }));

      // Check if user already purchased a ticket
      fetch('/api/conference/tickets/my-pass')
        .then((res) => res.json())
        .then((data) => {
          if (data.hasTicket && data.ticket) {
            setExistingTicket(data.ticket);
          }
        })
        .catch((e) => console.error('Error checking existing pass:', e));
    }
  }, [session]);

  // Fetch updated pricing from server
  useEffect(() => {
    fetch('/api/conference/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setPricing(data);
        }
      })
      .catch((e) => console.error('Error fetching conference pricing:', e));
  }, []);

  // Update Countdown
  useEffect(() => {
    const updateCountdown = () => {
      const target = pricing.deadlineTimestamp;
      const difference = target - Date.now();

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pricing.deadlineTimestamp]);

  // Handle Checkout Submission
  const handleProceedToCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!formData.name.trim()) {
      setCheckoutError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setCheckoutError('Please enter a valid email address.');
      return;
    }

    setLoadingCheckout(true);

    try {
      const res = await fetch('/api/conference/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout session');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Something went wrong. Please try again.');
      setLoadingCheckout(false);
    }
  };

  return (
    <section id="tickets" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative scroll-mt-12">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#FF6700]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[#FF6700] text-xs font-extrabold uppercase tracking-wider mb-4">
          <TicketIcon className="w-4 h-4" />
          <span>Conference Registration</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Reserve Your <span className="text-[#FF6700]">Conference Pass</span>
        </h2>

        <p className="mt-4 text-white/80 text-base sm:text-lg leading-relaxed">
          Join 300+ students, faculty, venture capitalists, and business leaders on Friday, October 23, 2026 at the Stephen M. Ross School of Business.
        </p>

        {/* Existing Pass Notification if attendee already purchased */}
        {existingTicket && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-left backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-sm sm:text-base">
                  You already have an active pass ({existingTicket.tier})!
                </div>
                <div className="text-xs text-white/70">
                  Ticket Code: <span className="font-mono text-emerald-300 font-bold">{existingTicket.ticketCode}</span>
                </div>
              </div>
            </div>

            <a
              href={`/conference/success?ticket_id=${existingTicket.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              <span>View Your Pass & QR</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}
      </div>

      {/* ── PASS CARDS GRID ── */}
      <div className="max-w-xl mx-auto">
        <div className="relative rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-white/10 to-white/[0.04] border-2 border-orange-500/50 backdrop-blur-xl shadow-2xl shadow-orange-950/40">
          
          {/* Top Floating Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            {pricing.phase === 'EARLY_BIRD' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6700] to-[#FF5500] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/40 border border-white/20">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Early Bird Special • Limited Time</span>
              </span>
            ) : pricing.phase === 'GENERAL' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-lg border border-white/20">
                <span>General Admission</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600/80 text-white text-xs font-black uppercase tracking-wider shadow-lg border border-white/20">
                <span>Registration Closed</span>
              </span>
            )}
          </div>

          {/* Pricing Header */}
          <div className="text-center pt-2">
            <h3 className="text-2xl font-black text-white">
              {pricing.tierName}
            </h3>
            
            <div className="mt-4 flex items-baseline justify-center gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {pricing.priceLabel}
              </span>
              <span className="text-white/60 text-sm font-semibold">USD</span>

              {pricing.regularPriceLabel && pricing.phase === 'EARLY_BIRD' && (
                <span className="text-xl sm:text-2xl text-white/40 line-through font-bold">
                  {pricing.regularPriceLabel}
                </span>
              )}
            </div>

            {/* Discount note or deadline notice */}
            {pricing.discountNote && pricing.phase === 'EARLY_BIRD' && (
              <div className="mt-2 text-xs font-extrabold text-orange-300">
                ⚡ {pricing.discountNote} (Ends Mon, Sep 21 at 12:00 AM EDT)
              </div>
            )}

            {pricing.phase === 'GENERAL' && (
              <div className="mt-2 text-xs font-bold text-white/70">
                Tickets available until Thu, Oct 22 at 8:00 AM EDT
              </div>
            )}
          </div>

          {/* Live Countdown Clock */}
          {timeLeft && pricing.isAvailable && (
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF6700] mb-2 flex items-center justify-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>
                  {pricing.phase === 'EARLY_BIRD' ? 'Early Bird Ends In' : 'Registration Closes In'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center max-w-xs mx-auto">
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-lg sm:text-xl font-black text-white">{timeLeft.days}</div>
                  <div className="text-[10px] text-white/50 uppercase font-semibold">Days</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-lg sm:text-xl font-black text-white">{timeLeft.hours}</div>
                  <div className="text-[10px] text-white/50 uppercase font-semibold">Hours</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-lg sm:text-xl font-black text-white">{timeLeft.minutes}</div>
                  <div className="text-[10px] text-white/50 uppercase font-semibold">Mins</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <div className="text-lg sm:text-xl font-black text-white">{timeLeft.seconds}</div>
                  <div className="text-[10px] text-white/50 uppercase font-semibold">Secs</div>
                </div>
              </div>
            </div>
          )}

          {/* Perks & Benefits Checklist */}
          <div className="mt-8 space-y-3.5 border-t border-white/10 pt-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/60 mb-2">
              All Passes Include:
            </div>
            
            <div className="flex items-start gap-3 text-sm text-white/90">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6700] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Full-day access to all Keynotes & Expert Panels (Finance & VC)</span>
            </div>

            <div className="flex items-start gap-3 text-sm text-white/90">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6700] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Interactive Case Workshop on AI Deployments</span>
            </div>

            <div className="flex items-start gap-3 text-sm text-white/90">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6700] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Coffee Chats with corporate executives and founders</span>
            </div>

            <div className="flex items-start gap-3 text-sm text-white/90">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6700] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Closing reception with drinks, appetizers & alumni networking</span>
            </div>

            <div className="flex items-start gap-3 text-sm text-white/90">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6700] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Digital Conference Pass with personalized check-in QR code</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8">
            {pricing.isAvailable ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6700] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6700] text-white font-extrabold text-lg shadow-xl shadow-orange-600/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-orange-400/40 flex items-center justify-center gap-2"
              >
                <TicketIcon className="w-6 h-6" />
                <span>Get Your Pass — {pricing.priceLabel}</span>
              </button>
            ) : (
              <div className="w-full py-4 px-6 rounded-2xl bg-white/10 text-white/50 font-bold text-base text-center border border-white/10">
                Ticket Sales Have Concluded
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>Secure checkout via Stripe • Instant QR badge delivery to your email</span>
            </div>
          </div>

          {/* Stripe Live Site Compliance Disclosures & Policies */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3.5">
            {/* Accepted Payments */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/70">
              <span className="font-semibold text-white/50 mr-1">Accepted Payments:</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">Visa</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">Mastercard</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">Amex</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">Discover</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">Apple Pay</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">Google Pay</span>
            </div>

            {/* Refund & Delivery Policy Disclosures */}
            <div className="text-[11px] text-white/60 leading-relaxed max-w-lg mx-auto space-y-1">
              <p>
                <strong className="text-white/80">Refund Policy:</strong> All pass sales are final and non-refundable. Registrations may be transferred to another attendee up to 48 hours before the event by contacting{' '}
                <a href="mailto:ABGContact@umich.edu" className="text-[#FF6700] underline">
                  ABGContact@umich.edu
                </a>.
              </p>
              <p>
                <strong className="text-white/80">Delivery:</strong> Digital ticket passes with unique check-in QR codes are issued immediately via email upon payment confirmation.
              </p>
              <p>
                <strong className="text-white/80">Merchant:</strong> AI Business Group • Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109 • Billed in USD.
              </p>
            </div>

            {/* Legal & Support Links */}
            <div className="flex items-center justify-center gap-4 text-xs text-white/50 pt-1">
              <a href="/terms" target="_blank" className="hover:text-white underline">
                Terms of Use & Event Policies
              </a>
              <span>•</span>
              <a href="/privacy" target="_blank" className="hover:text-white underline">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="mailto:ABGContact@umich.edu" className="hover:text-white underline">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── ATTENDEE INFORMATION MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#001e3b] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => !loadingCheckout && setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#FF6700] flex items-center justify-center flex-shrink-0">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">
                    Attendee Information
                  </h3>
                  <p className="text-xs text-white/60">
                    {pricing.tierName} • {pricing.priceLabel} USD
                  </p>
                </div>
              </div>

              {checkoutError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium">
                  {checkoutError}
                </div>
              )}

              <form onSubmit={handleProceedToCheckout} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-1.5">
                    Full Name <span className="text-[#FF6700]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    disabled={loadingCheckout}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#FF6700] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-1.5">
                    Email Address <span className="text-[#FF6700]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@umich.edu or personal email"
                    disabled={loadingCheckout}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#FF6700] text-sm"
                  />
                  <span className="text-[11px] text-white/50 mt-1 block">
                    Your QR ticket badge and receipt will be delivered to this address.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-1.5">
                    Affiliation
                  </label>
                  <select
                    value={formData.affiliation}
                    onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                    disabled={loadingCheckout}
                    className="w-full px-4 py-3 rounded-xl bg-[#00172e] border border-white/15 text-white focus:outline-none focus:border-[#FF6700] text-sm"
                  >
                    <option value="umich_student">University of Michigan Student</option>
                    <option value="umich_faculty">UMich Faculty / Researcher</option>
                    <option value="alumni">UMich Alumni</option>
                    <option value="industry">Corporate Executive / Industry Professional</option>
                    <option value="other">Other Attendee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-1.5">
                    Dietary Restrictions (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.dietaryRestrictions}
                    onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                    placeholder="None, Vegetarian, Vegan, Gluten-Free, Halal, etc."
                    disabled={loadingCheckout}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#FF6700] text-sm"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loadingCheckout}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#FF6700] hover:bg-[#FF7700] disabled:bg-white/20 text-white font-extrabold text-base shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {loadingCheckout ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Connecting to Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Stripe Checkout</span>
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <div className="text-[11px] text-white/50 text-center mt-2.5">
                    Supports Apple Pay, Google Pay, and all major Credit Cards.
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
