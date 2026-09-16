'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  CalendarIcon, 
  MapPinIcon, 
  PrinterIcon, 
  TicketIcon, 
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import FloatingShapes from '@/components/FloatingShapes';
import { ConferenceTicket } from '@/types/conference-ticket';
import { getGoogleCalendarUrl } from '@/lib/conference-calendar';

function ConferenceSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const ticketId = searchParams.get('ticket_id');

  const [ticket, setTicket] = useState<ConferenceTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId && !ticketId) {
      setError('No session or ticket identifier found in URL.');
      setLoading(false);
      return;
    }

    const query = sessionId ? `session_id=${sessionId}` : `ticket_id=${ticketId}`;

    fetch(`/api/conference/tickets/verify?${query}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to retrieve ticket pass');
        }
        setTicket(data.ticket);
      })
      .catch((err) => {
        console.error('Error verifying ticket:', err);
        setError(err.message || 'Unable to load ticket details.');
      })
      .finally(() => setLoading(false));
  }, [sessionId, ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00172e] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FloatingShapes variant="dense" opacity={0.06} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-[#FF6700] rounded-full animate-spin mb-4" />
          <h2 className="text-2xl font-black text-white">Generating Your Conference Pass...</h2>
          <p className="text-white/60 text-sm mt-2 max-w-sm">
            Verifying your payment with Stripe and creating your official check-in badge.
          </p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#00172e] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FloatingShapes variant="dense" opacity={0.06} />
        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Notice</h2>
          <p className="text-white/70 text-sm mb-6 leading-relaxed">
            {error || 'We could not display your ticket pass at this moment. If your payment succeeded, your confirmation has been emailed to you.'}
          </p>
          <Link
            href="/conference"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6700] hover:bg-[#FF7700] text-white font-bold transition-all text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Return to Conference Page</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00172e] text-white selection:bg-[#FF6700] selection:text-white py-12 px-4 sm:px-6 relative overflow-hidden print:bg-white print:text-black print:p-0">
      <FloatingShapes variant="dense" opacity={0.06} />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Back Link */}
        <div className="mb-6 print:hidden">
          <Link
            href="/conference"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Michigan AI Business Conference</span>
          </Link>
        </div>

        {/* Success Alert Banner */}
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-6 mb-8 backdrop-blur-md flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left print:hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Registration Confirmed!
            </h1>
            <p className="text-white/80 text-sm mt-1 leading-relaxed">
              A copy of your pass and receipt was sent to <strong className="text-white">{ticket.attendeeEmail}</strong>. Please present this QR badge at the registration desk on Friday, October 23, 2026.
            </p>
          </div>
        </div>

        {/* ── THE OFFICIAL DIGITAL PASS CARD ── */}
        <div className="bg-gradient-to-b from-[#00274c] to-[#001e3b] border-2 border-[#FF6700]/40 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl print:border-black print:bg-white print:text-black">
          
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-[#FF6700] via-[#FF5500] to-[#E64D00] p-6 sm:p-8 text-white relative">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Official Admission Pass</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Michigan AI Business Conference 2026
                </h2>
                <p className="text-white/90 text-sm font-semibold mt-1">
                  University of Michigan • Stephen M. Ross School of Business
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/80 font-bold">
                  Pass Type
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {ticket.tier}
                </div>
              </div>
            </div>
          </div>

          {/* Card Body with QR Code and Attendee Details */}
          <div className="p-6 sm:p-10 grid md:grid-cols-12 gap-8 items-center">
            {/* Left Column: Attendee & Event Info */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#FF6700] font-extrabold mb-1">
                  Attendee Name
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white print:text-black">
                  {ticket.attendeeName}
                </div>
                <div className="text-sm text-white/70 print:text-gray-600 mt-0.5">
                  {ticket.attendeeEmail}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10 print:border-gray-200">
                <div>
                  <div className="text-xs text-white/50 print:text-gray-500 font-bold uppercase tracking-wider">
                    Date & Time
                  </div>
                  <div className="text-sm font-bold text-white print:text-black mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#FF6700]" />
                    <span>Fri, Oct 23, 2026</span>
                  </div>
                  <div className="text-xs text-white/70 print:text-gray-600">8:30 AM - 5:30 PM EDT</div>
                </div>

                <div>
                  <div className="text-xs text-white/50 print:text-gray-500 font-bold uppercase tracking-wider">
                    Location
                  </div>
                  <div className="text-sm font-bold text-white print:text-black mt-1 flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4 text-[#FF6700]" />
                    <span>Ross School of Business</span>
                  </div>
                  <div className="text-xs text-white/70 print:text-gray-600">Winter Garden Registration</div>
                </div>

                <div>
                  <div className="text-xs text-white/50 print:text-gray-500 font-bold uppercase tracking-wider">
                    Ticket Code
                  </div>
                  <div className="text-sm font-black text-orange-300 print:text-black mt-1 tracking-widest font-mono">
                    {ticket.ticketCode}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-white/50 print:text-gray-500 font-bold uppercase tracking-wider">
                    Amount Paid
                  </div>
                  <div className="text-sm font-bold text-white print:text-black mt-1">
                    ${ticket.amountPaid}.00 USD
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/60 print:text-gray-500 leading-relaxed">
                Includes full-day keynote & panel access, interactive case workshop, catered networking lunch, and closing reception.
              </div>
            </div>

            {/* Right Column: Scannable QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-white rounded-2xl text-center shadow-lg border border-white/20">
              {ticket.qrCodeDataUrl ? (
                <img
                  src={ticket.qrCodeDataUrl}
                  alt={`QR Code Pass for ${ticket.ticketCode}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  Generating QR...
                </div>
              )}
              <div className="mt-3 font-mono font-black text-sm text-[#00274c] tracking-widest">
                {ticket.ticketCode}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">
                Scan for entry badge
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 print:hidden">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF6700] hover:bg-[#FF7700] text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 hover:scale-[1.02] transition-all"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Add to Google Calendar</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-80" />
          </a>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 hover:border-white/40 transition-all shadow-md"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Print or Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConferenceSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#00172e] text-white flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-[#FF6700] rounded-full animate-spin" />
        </div>
      }
    >
      <ConferenceSuccessContent />
    </Suspense>
  );
}
