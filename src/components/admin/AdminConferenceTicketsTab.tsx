'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  TicketIcon,
  CurrencyDollarIcon,
  UserCheckIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { ConferenceTicket, AdminTicketStats, TicketPricingStatus } from '@/types/conference-ticket';
import { getConferenceTicketStatus } from '@/lib/conference-pricing';

export default function AdminConferenceTicketsTab() {
  const [tickets, setTickets] = useState<ConferenceTicket[]>([]);
  const [stats, setStats] = useState<AdminTicketStats>({
    totalTickets: 0,
    grossRevenue: 0,
    earlyBirdCount: 0,
    generalCount: 0,
    checkedInCount: 0,
    pendingCheckInCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingStatus, setPricingStatus] = useState<TicketPricingStatus>(getConferenceTicketStatus());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTickets = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/conference/tickets${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        setStats(
          data.stats || {
            totalTickets: 0,
            grossRevenue: 0,
            earlyBirdCount: 0,
            generalCount: 0,
            checkedInCount: 0,
            pendingCheckInCount: 0,
          }
        );
      } else {
        toast.error(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      toast.error('Network error loading tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetch('/api/conference/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setPricingStatus(data);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(searchQuery);
  };

  const handleToggleCheckIn = async (ticket: ConferenceTicket) => {
    const newCheckedIn = !ticket.checkedIn;
    setTogglingId(ticket.id);

    try {
      const res = await fetch('/api/admin/conference/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          checkedIn: newCheckedIn,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, checkedIn: newCheckedIn, checkedInAt: newCheckedIn ? Date.now() : undefined } : t))
        );
        setStats((prev) => ({
          ...prev,
          checkedInCount: newCheckedIn ? prev.checkedInCount + 1 : prev.checkedInCount - 1,
          pendingCheckInCount: newCheckedIn ? prev.pendingCheckInCount - 1 : prev.pendingCheckInCount + 1,
        }));
        toast.success(newCheckedIn ? `Checked in ${ticket.attendeeName}` : `Unchecked ${ticket.attendeeName}`);
      } else {
        toast.error(data.error || 'Failed to update check-in status');
      }
    } catch (err) {
      toast.error('Network error updating check-in');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDownloadCsv = () => {
    window.open('/api/admin/conference/tickets?format=csv', '_blank');
  };

  return (
    <div className="space-y-8">
      {/* ── LIVE PRICING STATUS BAR ── */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Ticketing Phase</span>
          </div>
          <h3 className="text-xl font-black text-gray-900 mt-1">
            Current Tier: <span className="text-[#FF6700]">{pricingStatus.tierName} ({pricingStatus.priceLabel})</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {pricingStatus.phase === 'EARLY_BIRD'
              ? 'Early Bird ($13) active until Sun, Sep 20 at 11:59 PM EDT. Automatically switches to General Admission ($17) on Mon, Sep 21.'
              : pricingStatus.phase === 'GENERAL'
              ? 'General Admission ($17) active until Thu, Oct 22 at 8:00 AM EDT.'
              : 'Ticket sales have concluded.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => fetchTickets(searchQuery)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
            title="Refresh list"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export Roster (CSV)</span>
          </button>
        </div>
      </div>

      {/* ── METRICS TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00274c] flex items-center justify-center mb-3">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalTickets}</div>
          <div className="text-xs font-semibold text-gray-500 mt-1">Total Passes Sold</div>
          <div className="text-[11px] text-gray-400 mt-2">Target: 300 Attendees</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CurrencyDollarIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">${stats.grossRevenue.toLocaleString()}</div>
          <div className="text-xs font-semibold text-gray-500 mt-1">Gross Revenue (USD)</div>
          <div className="text-[11px] text-gray-400 mt-2">Processed via Stripe</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6700] flex items-center justify-center mb-3">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats.earlyBirdCount} / {stats.generalCount}</div>
          <div className="text-xs font-semibold text-gray-500 mt-1">Early Bird / General</div>
          <div className="text-[11px] text-gray-400 mt-2">$13 vs $17 distribution</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <UserCheckIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {stats.checkedInCount} <span className="text-sm font-normal text-gray-400">/ {stats.totalTickets}</span>
          </div>
          <div className="text-xs font-semibold text-gray-500 mt-1">Checked In at Ross</div>
          <div className="text-[11px] text-gray-400 mt-2">
            {stats.totalTickets > 0 ? `${Math.round((stats.checkedInCount / stats.totalTickets) * 100)}% attendance rate` : '0%'}
          </div>
        </div>
      </div>

      {/* ── ATTENDEE SEARCH & ROSTER TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search header */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900">Confirmed Attendees & Ticketholders</h4>
            <p className="text-xs text-gray-500">Search by attendee name, email address, or ticket confirmation code</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roster..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF6700]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Attendee</th>
                <th className="px-5 py-3.5">Pass Tier</th>
                <th className="px-5 py-3.5">Affiliation</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Purchase Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-[#FF6700] rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading attendee roster...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    {searchQuery ? 'No attendees match your search query.' : 'No tickets have been sold yet. Sales will appear here automatically.'}
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-[#00274c]">
                      {t.ticketCode}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900">{t.attendeeName}</div>
                      <div className="text-xs text-gray-500">{t.attendeeEmail}</div>
                      {t.dietaryRestrictions && (
                        <div className="text-[11px] text-amber-600 font-medium mt-0.5">
                          Diet: {t.dietaryRestrictions}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          t.tier === 'Early Bird Pass'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600 capitalize">
                      {t.affiliation?.replace('_', ' ') || 'Other'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      ${t.amountPaid}.00
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Confirmed</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleToggleCheckIn(t)}
                        disabled={togglingId === t.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          t.checkedIn
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {t.checkedIn ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span>Checked In</span>
                          </>
                        ) : (
                          <>
                            <UserCheckIcon className="w-4 h-4 text-gray-400" />
                            <span>Mark In</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
