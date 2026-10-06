'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  PlusIcon, 
  QrCodeIcon, 
  UsersIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Meeting, MeetingAttendee, MeetingCategory } from '@/types/meetings';

export default function MeetingsTab() {
  const [mounted, setMounted] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // New meeting form
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<MeetingCategory>('General Meeting');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // QR Modal
  const [qrMeeting, setQrMeeting] = useState<Meeting | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Attendees Modal
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load meetings
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(Array.isArray(data?.meetings) ? data.meetings : []);
      } else {
        toast.error('Failed to load meetings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a meeting name');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date, category }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Meeting "${data.meeting.name}" created!`);
        setName('');
        setShowCreateForm(false);
        loadMeetings();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (meeting: Meeting) => {
    const updatedIsOpen = !meeting.isOpen;
    try {
      const res = await fetch(`/api/admin/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: updatedIsOpen }),
      });

      if (res.ok) {
        toast.success(`Check-in ${updatedIsOpen ? 'opened' : 'closed'}`);
        setMeetings((prev) =>
          prev.map((m) => (m.id === meeting.id ? { ...m, isOpen: updatedIsOpen } : m))
        );
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating status');
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!confirm(`Are you sure you want to delete "${meeting.name}" and all its attendance records?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/meetings/${meeting.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Meeting deleted');
        setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
        if (activeMeeting?.id === meeting.id) setActiveMeeting(null);
        if (qrMeeting?.id === meeting.id) setQrMeeting(null);
      } else {
        toast.error('Failed to delete meeting');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting meeting');
    }
  };

  const handleOpenQR = async (meeting: Meeting) => {
    setQrMeeting(meeting);
    setQrDataUrl(null);
    setQrLoading(true);
    setCopiedLink(false);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const checkinUrl = `${origin}/attendance/meeting/${meeting.id}`;

    // 1. Fetch from server API first (which generates reliable QR code on server)
    try {
      const res = await fetch(`/api/admin/meetings/${meeting.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.qrCodeDataUrl) {
          setQrDataUrl(data.qrCodeDataUrl);
          setQrLoading(false);
          return;
        }
      }
    } catch (apiErr) {
      console.warn('Server QR fetch fallback:', apiErr);
    }

    // 2. Client-side fallback if server didn't provide it
    try {
      const qrModule = await import('qrcode');
      const qrLib: any = qrModule.default || qrModule;
      if (typeof qrLib.toDataURL === 'function') {
        const url = await qrLib.toDataURL(checkinUrl, {
          width: 340,
          margin: 2,
          color: {
            dark: '#00274c',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!qrMeeting) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const checkinUrl = `${origin}/attendance/meeting/${qrMeeting.id}`;
    navigator.clipboard.writeText(checkinUrl);
    setCopiedLink(true);
    toast.success('Check-in link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !qrMeeting) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${qrMeeting.name.replace(/\s+/g, '_')}_${qrMeeting.date}.png`;
    a.click();
  };

  const handleViewAttendees = async (meeting: Meeting) => {
    setActiveMeeting(meeting);
    setAttendees([]);
    setLoadingAttendees(true);
    try {
      const res = await fetch(`/api/admin/meetings/${meeting.id}`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(Array.isArray(data?.attendees) ? data.attendees : []);
      } else {
        toast.error('Failed to load attendees');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleExportCSV = () => {
    if (!activeMeeting || attendees.length === 0) return;

    const headers = ['Name', 'Email', 'Roles', 'Check-In Timestamp'];
    const rows = attendees.map((a) => [
      `"${(a.userName || '').replace(/"/g, '""')}"`,
      `"${(a.userEmail || '').replace(/"/g, '""')}"`,
      `"${(a.userRoles || []).join('; ')}"`,
      `"${a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendees_${activeMeeting.name.replace(/\s+/g, '_')}_${activeMeeting.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'Education Meeting':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Project Team':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'General Meeting':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch = (m.name || '').toLowerCase().includes(search.toLowerCase()) || (m.date || '').includes(search);
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            {showCreateForm ? 'Close Form' : 'New Meeting'}
          </button>
          <span className="text-xs text-gray-500 font-medium">
            {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'} total
          </span>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:bg-white text-gray-900"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00274c]"
          >
            <option value="ALL">All Categories</option>
            <option value="General Meeting">General Meeting</option>
            <option value="Education Meeting">Education Meeting</option>
            <option value="Project Team">Project Team</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Create Meeting Expandable Card */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateMeeting}
          className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Create Meeting
            </h3>
            <span className="text-xs text-gray-500">Fast check-in setup (no event page required)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Meeting Name *
              </label>
              <input
                type="text"
                placeholder="e.g. General Meeting #1, Education Series: LLM Intro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00274c] text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Meeting Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00274c] text-gray-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category Tag
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MeetingCategory)}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00274c] text-gray-900"
              >
                <option value="General Meeting">General Meeting</option>
                <option value="Education Meeting">Education Meeting</option>
                <option value="Project Team">Project Team</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 px-4 rounded-xl bg-[#00274c] hover:bg-[#003366] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {creating ? 'Creating...' : 'Save & Generate QR'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Meetings List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            Loading meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm font-medium">No meetings found.</p>
            <p className="text-xs text-gray-400 mt-1">Create a meeting above to generate your first attendance QR code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Meeting Name</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Check-In Status</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Attendees</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {meeting.name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-mono text-xs">
                      {meeting.date}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryBadge(meeting.category)}`}>
                        {meeting.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(meeting)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          meeting.isOpen
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                        title="Click to toggle check-in active/inactive"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meeting.isOpen ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {meeting.isOpen ? 'Active' : 'Closed'}
                      </button>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewAttendees(meeting)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-all cursor-pointer border border-blue-200/60"
                        title="View attendees"
                      >
                        <UsersIcon className="w-3.5 h-3.5" />
                        {meeting.attendeeCount ?? 0}
                      </button>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Explicit Attendees Button */}
                        <button
                          onClick={() => handleViewAttendees(meeting)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition-all cursor-pointer"
                          title="View Attendees"
                        >
                          <UsersIcon className="w-3.5 h-3.5 text-blue-600" />
                          Attendees
                        </button>

                        {/* Explicit QR Code Button */}
                        <button
                          onClick={() => handleOpenQR(meeting)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-all cursor-pointer"
                          title="Generate & View QR Code"
                        >
                          <QrCodeIcon className="w-4 h-4 text-emerald-600" />
                          QR Code
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMeeting(meeting)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete meeting"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Presentation Modal - Rendered via createPortal directly into document.body */}
      {mounted && qrMeeting && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setQrMeeting(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrMeeting(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-2 ${getCategoryBadge(qrMeeting.category)}`}>
              {qrMeeting.category}
            </span>

            <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{qrMeeting.name}</h3>
            <p className="text-xs text-gray-500 mb-5">📅 {qrMeeting.date}</p>

            {/* QR Code Visual Area */}
            <div className="bg-gradient-to-br from-[#00274c]/5 to-blue-50 p-4 rounded-2xl border border-gray-200/80 mb-5 inline-block shadow-inner min-h-[280px] min-w-[280px] flex items-center justify-center">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-9 h-9 border-3 border-[#00274c]/20 border-t-[#00274c] rounded-full animate-spin mb-3" />
                  <p className="text-xs font-medium text-gray-600">Generating QR code...</p>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${qrMeeting.name}`}
                  className="w-64 h-64 mx-auto rounded-lg"
                />
              ) : (
                <div className="text-center p-4">
                  <p className="text-xs text-red-500 mb-2">QR code could not be previewed.</p>
                  <p className="text-[11px] text-gray-500">You can still copy or open the direct check-in link below.</p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-5">
              Scan with phone camera to check in. Sign-in required, no photo needed.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00274c] hover:bg-[#003366] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                {copiedLink ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                {copiedLink ? 'Link Copied!' : 'Copy Check-In Link'}
              </button>

              <div className="flex gap-2">
                {qrDataUrl && (
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Save Image
                  </button>
                )}

                <a
                  href={`/attendance/meeting/${qrMeeting.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  Preview Link
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Attendees Modal - Rendered via createPortal directly into document.body */}
      {mounted && activeMeeting && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setActiveMeeting(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-1 ${getCategoryBadge(activeMeeting.category)}`}>
                  {activeMeeting.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{activeMeeting.name}</h3>
                <p className="text-xs text-gray-500">
                  {attendees.length} checked-in attendee{attendees.length === 1 ? '' : 's'} • {activeMeeting.date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {attendees.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-500" />
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => setActiveMeeting(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Attendee List Content */}
            <div className="flex-1 overflow-y-auto py-4">
              {loadingAttendees ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  Loading attendees...
                </div>
              ) : attendees.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No one has checked in to this meeting yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {attendees.map((attendee, index) => (
                    <div
                      key={attendee.id || index}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#00274c] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {attendee.userName ? attendee.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {attendee.userName || 'Member'}
                          </p>
                          <p className="text-xs text-gray-500">{attendee.userEmail}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 justify-end mb-0.5">
                          {(attendee.userRoles || []).map((r) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                            >
                              {r === 'PROJECT_TEAM_MEMBER'
                                ? 'Project Team'
                                : r === 'GENERAL_MEMBER'
                                ? 'General Member'
                                : r}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {attendee.checkedInAt
                            ? new Date(attendee.checkedInAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveMeeting(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
