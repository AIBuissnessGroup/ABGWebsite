'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  TicketIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  GiftIcon,
  UserGroupIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  XMarkIcon,
  EnvelopeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { ConferenceTicket, AdminTicketStats, TicketPricingStatus } from '@/types/conference-ticket';
import { getConferenceTicketStatus } from '@/lib/conference-pricing';
import ConferenceReminderModal from '@/components/admin/ConferenceReminderModal';
import ConferenceCalendarModal from '@/components/admin/ConferenceCalendarModal';

export default function AdminConferenceTicketsTab() {
  const [tickets, setTickets] = useState<ConferenceTicket[]>([]);
  const [stats, setStats] = useState<AdminTicketStats>({
    totalTickets: 0,
    grossRevenue: 0,
    earlyBirdCount: 0,
    generalCount: 0,
    compCount: 0,
    checkedInCount: 0,
    pendingCheckInCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingStatus, setPricingStatus] = useState<TicketPricingStatus>(getConferenceTicketStatus());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCompForm, setShowCompForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkAffiliation, setBulkAffiliation] = useState('high_school_student');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ name: string; outcome: 'added' | 'exists' | 'failed'; detail: string }[]>([]);
  const [issuingComp, setIssuingComp] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvEntries, setCsvEntries] = useState<Array<{ first: string; last: string; email: string }>>([]);
  const [csvAffiliation, setCsvAffiliation] = useState('other');
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvSummary, setCsvSummary] = useState<{
    total: number;
    importedCount: number;
    skippedCount: number;
    errorCount: number;
    imported: Array<{ name: string; email?: string; ticketCode: string }>;
    skipped: Array<{ name: string; email?: string; reason: string; ticketCode?: string }>;
    errors: Array<{ name: string; email?: string; error: string }>;
  } | null>(null);

  const parseCsvContent = (text: string): Array<{ first: string; last: string; email: string }> => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const parsedRows: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      parsedRows.push(row);
    }

    if (parsedRows.length === 0) return [];

    // Detect if first row is header
    const firstRowLower = parsedRows[0].map((c) => c.toLowerCase());
    const isHeader = firstRowLower.some(
      (c) => c.includes('first') || c.includes('name') || c.includes('email') || c.includes('last')
    );

    const dataRows = isHeader ? parsedRows.slice(1) : parsedRows;

    return dataRows
      .map((cols) => {
        const first = (cols[0] || '').trim();
        const last = (cols[1] || '').trim();
        const email = (cols[2] || '').trim();
        return { first, last, email };
      })
      .filter((entry) => entry.first.length > 0 || entry.last.length > 0);
  };

  const handleDownloadSampleCsv = () => {
    const sample = 'first,last,email\nAlex,Rivera,alex@umich.edu\nJordan,Smith,\nTaylor,Kim,taylor.kim@gmail.com';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conference_attendees_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a valid .csv file');
      return;
    }

    setCsvFile(file);
    setCsvSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCsvContent(content);
        setCsvEntries(parsed);
        if (parsed.length === 0) {
          toast.error('No attendee rows found in CSV');
        } else {
          toast.success(`Loaded ${parsed.length} attendee(s) from CSV`);
        }
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read CSV file');
    };
    reader.readAsText(file);
  };

  const handleResetCsv = () => {
    setCsvFile(null);
    setCsvEntries([]);
    setCsvSummary(null);
  };

  const handleBulkCsvSubmit = async () => {
    if (csvEntries.length === 0) {
      toast.error('No attendees found to import');
      return;
    }

    setCsvUploading(true);
    try {
      const res = await fetch('/api/admin/conference/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: csvEntries,
          affiliation: csvAffiliation,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCsvSummary(data);
        if (data.importedCount > 0) {
          toast.success(`Successfully created ${data.importedCount} ticket(s)`);
        }
        if (data.skippedCount > 0) {
          toast(`Skipped ${data.skippedCount} attendee(s) already on roster`, { icon: 'ℹ️' });
        }
        fetchTickets(searchQuery);
      } else {
        toast.error(data.error || 'Failed to import CSV tickets');
      }
    } catch (err) {
      console.error('Bulk CSV import error:', err);
      toast.error('Network error importing CSV tickets');
    } finally {
      setCsvUploading(false);
    }
  };

  const [compForm, setCompForm] = useState({
    name: '',
    email: '',
    affiliation: 'umich_student',
    dietaryRestrictions: '',
    sendEmail: true,
  });

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
            compCount: 0,
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

  const handleIssueComp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuingComp(true);

    try {
      const res = await fetch('/api/admin/conference/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm),
      });

      const data = await res.json();
      if (res.ok) {
        if (compForm.sendEmail && compForm.email && !data.emailSent) {
          toast.error(`Issued ${data.ticket.ticketCode}, but the pass email to ${data.ticket.attendeeEmail} failed to send`);
        } else {
          toast.success(`Issued ${data.ticket.ticketCode} to ${data.ticket.attendeeName}`);
        }
        setCompForm((prev) => ({ ...prev, name: '', email: '', dietaryRestrictions: '' }));
        fetchTickets(searchQuery);
      } else {
        toast.error(data.error || 'Failed to issue complimentary ticket');
      }
    } catch (err) {
      toast.error('Network error issuing complimentary ticket');
    } finally {
      setIssuingComp(false);
    }
  };

  // One attendee per line: "First Last" or "First Last | dietary restriction"
  const bulkEntries = bulkText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split('|');
      return { name: name.trim(), dietaryRestrictions: rest.join('|').trim() };
    })
    .filter((entry) => entry.name.length >= 2);

  const handleBulkAdd = async () => {
    if (bulkEntries.length === 0) return;
    setBulkRunning(true);
    setBulkResults([]);
    const results: typeof bulkResults = [];

    // One at a time so duplicate checks see the passes just created
    for (const entry of bulkEntries) {
      try {
        const res = await fetch('/api/admin/conference/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: entry.name,
            email: '',
            affiliation: bulkAffiliation,
            dietaryRestrictions: entry.dietaryRestrictions,
            sendEmail: false,
          }),
        });
        const data = await res.json();
        if (res.ok) results.push({ name: entry.name, outcome: 'added', detail: data.ticket.ticketCode });
        else if (data.alreadyExists) results.push({ name: entry.name, outcome: 'exists', detail: data.ticketCode });
        else results.push({ name: entry.name, outcome: 'failed', detail: data.error || 'Failed' });
      } catch {
        results.push({ name: entry.name, outcome: 'failed', detail: 'Network error' });
      }
      setBulkResults([...results]);
    }

    const added = results.filter((r) => r.outcome === 'added').length;
    const exists = results.filter((r) => r.outcome === 'exists').length;
    const failed = results.filter((r) => r.outcome === 'failed').length;
    if (failed) toast.error(`Added ${added}, skipped ${exists} already on the roster, ${failed} failed`);
    else toast.success(`Added ${added}${exists ? `, skipped ${exists} already on the roster` : ''}`);
    if (added) setBulkText('');
    setBulkRunning(false);
    fetchTickets(searchQuery);
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
              ? 'General Admission ($17) active until Fri, Oct 23 at 10:30 AM EDT.'
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
            onClick={() => setShowCompForm((prev) => !prev)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] text-white text-sm font-bold shadow-sm transition-all"
          >
            <GiftIcon className="w-4 h-4" />
            <span>Issue Comp Ticket</span>
          </button>

          <button
            onClick={() => {
              setShowCsvModal(true);
              setCsvSummary(null);
            }}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6700] hover:bg-[#FF5500] text-white text-sm font-bold shadow-sm transition-all"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={() => setShowBulkForm((prev) => !prev)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#00274c] text-[#00274c] hover:bg-blue-50 text-sm font-bold shadow-sm transition-all"
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>Bulk Add Guests</span>
          </button>

          <button
            onClick={() => setShowReminderModal(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold shadow-sm transition-all"
            title="Send reminder email to ticket holders in BCC"
          >
            <EnvelopeIcon className="w-4 h-4" />
            <span>Send Reminder</span>
          </button>

          <button
            onClick={() => setShowCalendarModal(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003875] text-white text-sm font-bold shadow-sm transition-all"
            title="Send Google Calendar invites for the 7 conference sessions"
          >
            <CalendarDaysIcon className="w-4 h-4 text-[#FFCB05]" />
            <span>Calendar Invites</span>
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

      {/* ── ISSUE COMPLIMENTARY TICKET ── */}
      {showCompForm && (
        <form onSubmit={handleIssueComp} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900">Issue Complimentary Ticket</h4>
            <p className="text-xs text-gray-500">
              Creates a confirmed $0 pass without Stripe checkout. Email is optional: without one, no pass email is sent (download the PDF
              from the roster instead). One pass per email, or per name when there&apos;s no email.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={compForm.name}
              onChange={(e) => setCompForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Attendee full name"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF6700]"
            />
            <input
              type="email"
              value={compForm.email}
              onChange={(e) => setCompForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Attendee email (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF6700]"
            />
            <select
              value={compForm.affiliation}
              onChange={(e) => setCompForm((prev) => ({ ...prev, affiliation: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF6700]"
            >
              <option value="umich_student">UMich Student</option>
              <option value="umich_faculty">UMich Faculty</option>
              <option value="alumni">Alumni</option>
              <option value="industry">Industry</option>
              <option value="high_school_student">High School Student</option>
              <option value="high_school_teacher">High School Teacher</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              maxLength={200}
              value={compForm.dietaryRestrictions}
              onChange={(e) => setCompForm((prev) => ({ ...prev, dietaryRestrictions: e.target.value }))}
              placeholder="Dietary restrictions (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#FF6700]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={compForm.sendEmail && Boolean(compForm.email)}
                disabled={!compForm.email}
                onChange={(e) => setCompForm((prev) => ({ ...prev, sendEmail: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className={compForm.email ? '' : 'text-gray-400'}>Email the QR pass to the attendee</span>
            </label>

            <button
              type="submit"
              disabled={issuingComp}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6700] hover:bg-[#FF5500] disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
            >
              <GiftIcon className="w-4 h-4" />
              <span>{issuingComp ? 'Issuing...' : 'Issue Ticket'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── BULK ADD GUESTS (no email needed) ── */}
      {showBulkForm && (
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900">Bulk Add Guests</h4>
            <p className="text-xs text-gray-500">
              For groups without emails (e.g. high school students). Paste one person per line as <span className="font-mono">First Last</span>,
              optionally followed by <span className="font-mono">| dietary restriction</span>. Each gets a free Complimentary pass; anyone
              whose name is already on the roster is skipped. No emails are sent; download passes as PDFs from the roster or check guests in by
              name.
            </p>
          </div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder={'Ethan Bray\nSophia Charvat\nSarah Hobart | Gluten free'}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:border-[#00274c]"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={bulkAffiliation}
                onChange={(e) => setBulkAffiliation(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#00274c]"
              >
                <option value="umich_student">UMich Student</option>
                <option value="umich_faculty">UMich Faculty</option>
                <option value="alumni">Alumni</option>
                <option value="industry">Industry</option>
                <option value="high_school_student">High School Student</option>
                <option value="high_school_teacher">High School Teacher</option>
                <option value="other">Other</option>
              </select>
              <span className="text-xs text-gray-500">{bulkEntries.length} {bulkEntries.length === 1 ? 'person' : 'people'}</span>
            </div>
            <button
              onClick={handleBulkAdd}
              disabled={bulkRunning || bulkEntries.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-all"
            >
              <UserGroupIcon className="w-4 h-4" />
              <span>{bulkRunning ? `Adding ${bulkResults.length + 1} of ${bulkEntries.length}...` : `Add ${bulkEntries.length || ''} Guests`}</span>
            </button>
          </div>

          {bulkResults.length > 0 && (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm">
              {bulkResults.map((r) => (
                <li key={r.name} className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium text-gray-900">{r.name}</span>
                  <span
                    className={`text-xs font-bold ${
                      r.outcome === 'added' ? 'text-emerald-600' : r.outcome === 'exists' ? 'text-amber-600' : 'text-red-600'
                    }`}
                  >
                    {r.outcome === 'added' ? `Added · ${r.detail}` : r.outcome === 'exists' ? `Already on roster · ${r.detail}` : r.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── METRICS TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00274c] flex items-center justify-center mb-3">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalTickets}</div>
          <div className="text-xs font-semibold text-gray-500 mt-1">Total Passes Issued</div>
          <div className="text-[11px] text-gray-400 mt-2">Target: 300 Attendees</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6700] flex items-center justify-center mb-3">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats.earlyBirdCount} / {stats.generalCount}</div>
          <div className="text-xs font-semibold text-gray-500 mt-1">Early Bird / General</div>
          <div className="text-[11px] text-gray-400 mt-2">$13 vs $17 distribution · {stats.compCount} complimentary</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <CheckCircleIcon className="w-5 h-5" />
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
                <th className="px-5 py-3.5">Pass</th>
                <th className="px-5 py-3.5 text-right">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-[#FF6700] rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading attendee roster...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
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
                      <div className="text-xs text-gray-500">{t.attendeeEmail || <span className="italic text-gray-400">No email</span>}</div>
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
                            : t.tier === 'Complimentary'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600 capitalize">
                      {t.affiliation?.replace(/_/g, ' ') || 'Other'}
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
                    <td className="px-5 py-4">
                      <a
                        href={`/api/admin/conference/tickets/${encodeURIComponent(t.id)}/pdf`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#00274c] text-xs font-bold transition-all"
                        title={`Download ${t.attendeeName}'s pass as a PDF`}
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>PDF</span>
                      </a>
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
                            <CheckIcon className="w-4 h-4 text-gray-400" />
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

      {/* ── BULK CSV UPLOAD MODAL ── */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-orange-100 text-[#FF6700]">
                    <ArrowUpTrayIcon className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">Bulk Create Tickets from CSV</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a CSV file to create confirmed tickets for attendees who paid with an alternative method.
                  Passes are issued as Complimentary ($0), no automatic emails are sent, and duplicates are skipped.
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Post-Import Results Summary */}
            {csvSummary ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <span>Import Completed: {csvSummary.importedCount} ticket(s) created</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    Processed {csvSummary.total} row(s) in total. {csvSummary.skippedCount} skipped as already existing on the roster.
                  </p>
                </div>

                {/* Skipped Details */}
                {csvSummary.skipped.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Skipped ({csvSummary.skipped.length} already on roster)
                    </h5>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50/50 p-2 text-xs divide-y divide-amber-100">
                      {csvSummary.skipped.map((s, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between text-amber-900">
                          <span className="font-medium truncate mr-2">
                            {s.name} {s.email ? `(${s.email})` : ''}
                          </span>
                          <span className="font-bold text-amber-700 shrink-0">{s.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {csvSummary.errors && csvSummary.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">
                      Invalid Rows ({csvSummary.errors.length})
                    </h5>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-red-200 bg-red-50/50 p-2 text-xs divide-y divide-red-100">
                      {csvSummary.errors.map((e, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between text-red-900">
                          <span className="truncate mr-2">{e.name}</span>
                          <span className="font-bold text-red-700 shrink-0">{e.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleResetCsv}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                  >
                    Upload Another CSV
                  </button>
                  <button
                    onClick={() => setShowCsvModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] text-white text-sm font-bold shadow-sm transition-all"
                  >
                    Done & View Roster
                  </button>
                </div>
              </div>
            ) : (
              /* Pre-Import Upload & Preview */
              <div className="space-y-5">
                {/* Format Instructions & Sample Download */}
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#00274c] uppercase tracking-wider">Expected CSV Format</div>
                    <div className="text-sm font-mono text-gray-800 mt-0.5">
                      <span className="font-bold text-blue-700">first</span>, <span className="font-bold text-blue-700">last</span>, <span className="text-gray-500">email (optional)</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Header row is optional. If email is blank, guests will be checked in by name at the door.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-xs font-bold text-[#00274c] hover:bg-blue-50 transition-colors shadow-2xs whitespace-nowrap"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 text-[#FF6700]" />
                    <span>Download Sample CSV</span>
                  </button>
                </div>

                {/* Affiliation Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Default Affiliation for this Batch
                  </label>
                  <select
                    value={csvAffiliation}
                    onChange={(e) => setCsvAffiliation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#00274c]"
                  >
                    <option value="umich_student">UMich Student</option>
                    <option value="umich_faculty">UMich Faculty</option>
                    <option value="alumni">Alumni</option>
                    <option value="industry">Industry</option>
                    <option value="high_school_student">High School Student</option>
                    <option value="high_school_teacher">High School Teacher</option>
                    <option value="other">Other / General</option>
                  </select>
                </div>

                {/* File Dropzone */}
                {!csvFile ? (
                  <div className="border-2 border-dashed border-gray-300 hover:border-[#FF6700] rounded-2xl p-6 text-center transition-colors">
                    <input
                      type="file"
                      id="conference-csv-file-input"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="conference-csv-file-input" className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6700] flex items-center justify-center mx-auto mb-3">
                        <DocumentTextIcon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 block">Click to browse or drag and drop your CSV</span>
                      <span className="text-xs text-gray-500 mt-1 block">Columns: first, last, email</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected File Details */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2.5 truncate">
                        <DocumentTextIcon className="w-5 h-5 text-gray-500 shrink-0" />
                        <div className="truncate">
                          <div className="text-sm font-bold text-gray-900 truncate">{csvFile.name}</div>
                          <div className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB · {csvEntries.length} attendee(s) parsed</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetCsv}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove file"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview Table */}
                    {csvEntries.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Parsed Preview ({csvEntries.length} attendees)
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs">
                          {csvEntries.slice(0, 15).map((entry, idx) => (
                            <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                              <span className="font-semibold text-gray-900">
                                {entry.first} {entry.last}
                              </span>
                              {entry.email ? (
                                <span className="text-gray-600 font-mono">{entry.email}</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
                                  No email (Name check-in)
                                </span>
                              )}
                            </div>
                          ))}
                          {csvEntries.length > 15 && (
                            <div className="p-2 text-center text-gray-400 text-[11px] bg-gray-50/50">
                              ...and {csvEntries.length - 15} more attendee(s)
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkCsvSubmit}
                    disabled={csvUploading || csvEntries.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-all"
                  >
                    <ArrowUpTrayIcon className={`w-4 h-4 ${csvUploading ? 'animate-bounce' : ''}`} />
                    <span>{csvUploading ? `Creating ${csvEntries.length} Tickets...` : `Create ${csvEntries.length || ''} Tickets`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SEND REMINDER MODAL ── */}
      <ConferenceReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        tickets={tickets}
      />

      {/* ── GOOGLE CALENDAR INVITES MODAL ── */}
      <ConferenceCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </div>
  );
}
