'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  SparklesIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PhotoIcon, 
  LinkIcon, 
  UserGroupIcon, 
  ClockIcon, 
  BuildingOffice2Icon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { ConferenceData, ConferenceSpeaker, ConferenceScheduleItem, ConferenceSponsor } from '@/types/conference';
import { DEFAULT_CONFERENCE_DATA } from '@/lib/conference-defaults';
import { isAdmin } from '@/lib/roles';

export default function AdminConferencePage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ConferenceData>(DEFAULT_CONFERENCE_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'visibility' | 'content' | 'speakers' | 'schedule' | 'sponsors'>('visibility');

  // Speaker Modal State
  const [editingSpeaker, setEditingSpeaker] = useState<ConferenceSpeaker | null>(null);
  const [isNewSpeaker, setIsNewSpeaker] = useState(false);

  // Schedule Modal State
  const [editingSchedule, setEditingSchedule] = useState<ConferenceScheduleItem | null>(null);
  const [isNewSchedule, setIsNewSchedule] = useState(false);

  // Sponsor Modal State
  const [editingSponsor, setEditingSponsor] = useState<ConferenceSponsor | null>(null);
  const [isNewSponsor, setIsNewSponsor] = useState(false);

  // Check auth
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    if (!isAdmin(session.user?.roles || [])) {
      redirect('/auth/unauthorized');
    }
  }, [session, status]);

  // Load conference data
  useEffect(() => {
    if (session?.user) {
      fetch('/api/admin/conference')
        .then((res) => res.json())
        .then((resData) => {
          if (resData && !resData.error) {
            setData(resData);
          } else {
            setData(DEFAULT_CONFERENCE_DATA);
          }
        })
        .catch((err) => {
          console.error('Failed to load conference settings:', err);
          toast.error('Failed to load conference settings from server');
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  // Save handler
  const handleSave = async (customData?: Partial<ConferenceData>) => {
    setSaving(true);
    const payload = customData ? { ...data, ...customData } : data;
    try {
      const res = await fetch('/api/admin/conference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setData(result);
        toast.success('Conference page updated successfully!');
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving conference settings:', err);
      toast.error('Network error saving changes');
    } finally {
      setSaving(false);
    }
  };

  // Quick visibility toggle
  const toggleVisibility = async () => {
    const updated = !data.isVisible;
    setData((prev) => ({ ...prev, isVisible: updated }));
    await handleSave({ isVisible: updated });
  };

  // --- Speaker Handlers ---
  const handleSaveSpeaker = () => {
    if (!editingSpeaker) return;
    if (!editingSpeaker.name.trim()) {
      toast.error('Speaker name is required');
      return;
    }

    let updatedSpeakers = [...data.speakers];
    if (isNewSpeaker) {
      const newEntry = {
        ...editingSpeaker,
        id: `speaker-${Date.now()}`,
        order: updatedSpeakers.length + 1,
      };
      updatedSpeakers.push(newEntry);
    } else {
      updatedSpeakers = updatedSpeakers.map((s) => (s.id === editingSpeaker.id ? editingSpeaker : s));
    }

    setData((prev) => ({ ...prev, speakers: updatedSpeakers }));
    setEditingSpeaker(null);
    toast.success(isNewSpeaker ? 'Speaker added (Click Save Changes to persist)' : 'Speaker updated');
  };

  const handleDeleteSpeaker = (id: string) => {
    if (confirm('Are you sure you want to remove this speaker?')) {
      const updated = data.speakers.filter((s) => s.id !== id);
      setData((prev) => ({ ...prev, speakers: updated }));
      toast.success('Speaker removed');
    }
  };

  const handleMoveSpeaker = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.speakers.length) return;
    const updated = [...data.speakers];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setData((prev) => ({ ...prev, speakers: updated }));
  };

  // --- Schedule Handlers ---
  const handleSaveSchedule = () => {
    if (!editingSchedule) return;
    if (!editingSchedule.title.trim() || !editingSchedule.time.trim()) {
      toast.error('Time and Title are required');
      return;
    }

    let updatedSchedule = [...data.schedule];
    if (isNewSchedule) {
      const newEntry = {
        ...editingSchedule,
        id: `sched-${Date.now()}`,
        order: updatedSchedule.length + 1,
      };
      updatedSchedule.push(newEntry);
    } else {
      updatedSchedule = updatedSchedule.map((item) => (item.id === editingSchedule.id ? editingSchedule : item));
    }

    setData((prev) => ({ ...prev, schedule: updatedSchedule }));
    setEditingSchedule(null);
    toast.success(isNewSchedule ? 'Schedule item added' : 'Schedule item updated');
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Delete this schedule session?')) {
      setData((prev) => ({ ...prev, schedule: prev.schedule.filter((s) => s.id !== id) }));
      toast.success('Session deleted');
    }
  };

  // --- Sponsor Handlers ---
  const handleSaveSponsor = () => {
    if (!editingSponsor) return;
    if (!editingSponsor.name.trim()) {
      toast.error('Sponsor name is required');
      return;
    }

    let updatedSponsors = [...data.sponsors];
    if (isNewSponsor) {
      const newEntry = {
        ...editingSponsor,
        id: `sponsor-${Date.now()}`,
        order: updatedSponsors.length + 1,
      };
      updatedSponsors.push(newEntry);
    } else {
      updatedSponsors = updatedSponsors.map((sp) => (sp.id === editingSponsor.id ? editingSponsor : sp));
    }

    setData((prev) => ({ ...prev, sponsors: updatedSponsors }));
    setEditingSponsor(null);
    toast.success(isNewSponsor ? 'Sponsor added' : 'Sponsor updated');
  };

  const handleDeleteSponsor = (id: string) => {
    if (confirm('Delete this sponsor?')) {
      setData((prev) => ({ ...prev, sponsors: prev.sponsors.filter((sp) => sp.id !== id) }));
      toast.success('Sponsor deleted');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00274c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading conference management dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6700] flex items-center justify-center font-bold">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Michigan AI Business Conference</h1>
              <p className="text-sm text-gray-500">Manage temporary landing page, hero background, speaker cards, and redirect links</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/conference"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            <EyeIcon className="w-4 h-4 text-gray-500" />
            <span>View Live Page</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-gray-400" />
          </a>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#0e3b6e] text-white text-sm font-bold shadow-md shadow-blue-950/20 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 text-orange-400" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('visibility')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'visibility'
              ? 'bg-[#FF6700] text-white shadow-md shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {data.isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
          <span>Visibility & Hero</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'content'
              ? 'bg-[#00274c] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Description & Buttons</span>
        </button>

        <button
          onClick={() => setActiveTab('speakers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'speakers'
              ? 'bg-[#00274c] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserGroupIcon className="w-4 h-4" />
          <span>Speakers ({data.speakers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'schedule'
              ? 'bg-[#00274c] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span>Schedule ({data.schedule?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('sponsors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'sponsors'
              ? 'bg-[#00274c] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BuildingOffice2Icon className="w-4 h-4" />
          <span>Sponsors ({data.sponsors?.length || 0})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: VISIBILITY TOGGLE & HERO SETTINGS
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'visibility' && (
        <div className="space-y-6">
          {/* Visibility Switch Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">Page Visibility Status</span>
                  {data.isVisible ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      LIVE (Publicly Visible)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      HIDDEN (Private to Admins)
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Because this is a temporary special event page, toggle this switch when you want to make the page live on the website. When enabled, the bright orange <strong>&quot;AI Conference&quot;</strong> link automatically appears in the top navigation bar.
                </p>
              </div>

              {/* The Toggle Switch */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-700">
                  {data.isVisible ? 'Page is Live' : 'Page is Hidden'}
                </span>
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:ring-offset-2 ${
                    data.isVisible ? 'bg-[#FF6700]' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={data.isVisible}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      data.isVisible ? 'translate-x-8' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Hero Background Image Setting */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PhotoIcon className="w-5 h-5 text-gray-500" />
              <span>Hero Background Image</span>
            </h3>
            <p className="text-sm text-gray-500">
              Provide the direct image URL for the faded hero background. An optimized dark gradient overlay is automatically applied to maintain high readability.
            </p>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Background Image URL
                  </label>
                  <input
                    type="url"
                    value={data.backgroundImageUrl || ''}
                    onChange={(e) => setData({ ...data, backgroundImageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or /GroupPhoto.jpg"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] focus:border-[#FF6700] text-gray-900"
                  />
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-gray-500">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, backgroundImageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=2069&auto=format&fit=crop' })}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  >
                    Ross / Campus Architecture
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, backgroundImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop' })}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  >
                    Executive Conference Hall
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, backgroundImageUrl: '/GroupPhoto.jpg' })}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  >
                    ABG Team Photo
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Live Preview
                </label>
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-300 shadow-inner bg-gray-900">
                  {data.backgroundImageUrl ? (
                    <img
                      src={data.backgroundImageUrl}
                      alt="Hero Background Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00274c]/85 to-[#001e3b]/95 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-white text-xs font-bold">{data.title}</span>
                    <span className="text-orange-300 text-[10px] mt-1">{data.eventDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title & Date Metadata Settings */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Header Text & Logistics</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Event Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={data.subtitle}
                  onChange={(e) => setData({ ...data, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={data.badgeText}
                  onChange={(e) => setData({ ...data, badgeText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Event Date</label>
                <input
                  type="text"
                  value={data.eventDate}
                  onChange={(e) => setData({ ...data, eventDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Venue / Location</label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: DESCRIPTION & BUTTON REDIRECTS
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Button Redirect Links */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-[#FF6700]" />
                <span>Call to Action Button Redirects</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Control the destination URLs and button text labels shown to attendees.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Buy Tickets Button */}
              <div className="p-5 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-950">Primary Button (Buy Tickets)</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-200 text-orange-900">Hero CTA</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={data.ticketButtonText}
                    onChange={(e) => setData({ ...data, ticketButtonText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Redirect URL</label>
                  <input
                    type="text"
                    value={data.ticketButtonUrl}
                    onChange={(e) => setData({ ...data, ticketButtonUrl: e.target.value })}
                    placeholder="https://eventbrite.com/... or https://hailtotheinnovators.splashthat.com/"
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6700] text-gray-900"
                  />
                </div>
              </div>

              {/* Learn More Button */}
              <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Secondary Button (Learn More)</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-200 text-gray-800">Scroll Anchor</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={data.learnMoreButtonText}
                    onChange={(e) => setData({ ...data, learnMoreButtonText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gray-400 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Section or Link</label>
                  <input
                    type="text"
                    value={data.learnMoreButtonUrl}
                    onChange={(e) => setData({ ...data, learnMoreButtonUrl: e.target.value })}
                    placeholder="#about"
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gray-400 text-gray-900"
                  />
                </div>
              </div>

              {/* Sponsor Button */}
              <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-950">Sponsor Inquiry Button</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-200 text-blue-900">Sponsors Section</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Button Label</label>
                    <input
                      type="text"
                      value={data.sponsorButtonText}
                      onChange={(e) => setData({ ...data, sponsorButtonText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Redirect Link or Email Mailto</label>
                    <input
                      type="text"
                      value={data.sponsorButtonUrl}
                      onChange={(e) => setData({ ...data, sponsorButtonUrl: e.target.value })}
                      placeholder="mailto:contact@umichaibusiness.com?subject=Conference%20Sponsorship"
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Narrative Description */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Full Event Description</h3>
            <p className="text-sm text-gray-500">
              The primary narrative text detailing the full-day schedule, student & executive audience, Ross venue, and past SXSW / Wall Street programming.
            </p>
            <textarea
              rows={7}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full p-4 rounded-xl border border-gray-300 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-[#FF6700] text-gray-900"
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 3: SPEAKER CARDS MANAGER (5 CARDS IN A ROW ON LAPTOP)
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'speakers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Speaker Cards Manager</h3>
              <p className="text-sm text-gray-500">
                These cards render exactly <strong>5 in a row</strong> on a standard laptop screen. Add, reorder, or edit profile pictures and details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSpeaker({
                  id: '',
                  name: '',
                  role: '',
                  company: '',
                  photoUrl: '',
                  bio: '',
                  linkedinUrl: '',
                  order: (data.speakers?.length || 0) + 1,
                });
                setIsNewSpeaker(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6700] hover:bg-[#FF7700] text-white text-sm font-bold shadow transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add New Speaker</span>
            </button>
          </div>

          {/* Speakers List */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.speakers && data.speakers.length > 0 ? (
              data.speakers.map((speaker, index) => (
                <div
                  key={speaker.id || index}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#FF6700] transition-colors"
                >
                  <div>
                    {/* Picture Preview */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 border border-gray-200 flex items-center justify-center">
                      {speaker.photoUrl ? (
                        <img
                          src={speaker.photoUrl}
                          alt={speaker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl bg-gray-50">
                          {speaker.name ? speaker.name.charAt(0) : '?'}
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                        #{index + 1}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{speaker.name || 'Untitled Speaker'}</h4>
                    <p className="text-xs font-semibold text-[#FF6700] line-clamp-1 mt-0.5">{speaker.role || 'Role'}</p>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">{speaker.company || 'Company'}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSpeaker(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="Move left"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5 transform -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSpeaker(index, 'down')}
                        disabled={index === data.speakers.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="Move right"
                      >
                        <ArrowDownIcon className="w-3.5 h-3.5 transform -rotate-90" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSpeaker({ ...speaker });
                          setIsNewSpeaker(false);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Speaker"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpeaker(speaker.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Speaker"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-500">
                No speakers added yet. Click &quot;Add New Speaker&quot; above to start.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 4: SCHEDULE MANAGER
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Event Schedule Timeline</h3>
              <p className="text-sm text-gray-500">
                Manage keynote, panel, coffee chat, and networking slots for the conference.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSchedule({
                  id: '',
                  time: '',
                  title: '',
                  location: 'Stephen M. Ross School of Business',
                  description: '',
                  order: (data.schedule?.length || 0) + 1,
                });
                setIsNewSchedule(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00274c] hover:bg-[#0e3b6e] text-white text-sm font-bold shadow"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Schedule Session</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.schedule && data.schedule.length > 0 ? (
              data.schedule.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-800 text-xs font-extrabold flex-shrink-0">
                      {item.time}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      {item.location && (
                        <span className="inline-block text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-1">
                          📍 {item.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchedule({ ...item });
                        setIsNewSchedule(false);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 bg-white rounded-xl border border-gray-200 text-center text-gray-500">
                No schedule sessions added yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 5: SPONSORS MANAGER
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sponsors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Sponsors & Partners Manager</h3>
              <p className="text-sm text-gray-500">
                Add sponsors and institutional partners with their logo and website link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSponsor({
                  id: '',
                  name: '',
                  logoUrl: '',
                  websiteUrl: '',
                  tier: 'Platinum',
                  order: (data.sponsors?.length || 0) + 1,
                });
                setIsNewSponsor(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00274c] hover:bg-[#0e3b6e] text-white text-sm font-bold shadow"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Sponsor</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.sponsors && data.sponsors.length > 0 ? (
              data.sponsors.map((sponsor, index) => (
                <div
                  key={sponsor.id || index}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="h-20 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center p-3 mb-3">
                      {sponsor.logoUrl ? (
                        <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-12 max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-400">No logo provided</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{sponsor.name}</h4>
                    <span className="text-xs font-semibold text-[#FF6700] uppercase tracking-wider">{sponsor.tier} Partner</span>
                    {sponsor.websiteUrl && (
                      <p className="text-xs text-gray-400 truncate mt-1">{sponsor.websiteUrl}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSponsor({ ...sponsor });
                        setIsNewSponsor(false);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSponsor(sponsor.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 bg-white rounded-xl border border-gray-200 text-center text-gray-500">
                No sponsors listed. Click &quot;Add Sponsor&quot; above to add.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: EDIT / ADD SPEAKER
      ────────────────────────────────────────────────────────────────────────────── */}
      {editingSpeaker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-gray-900">
              {isNewSpeaker ? 'Add Speaker Card' : 'Edit Speaker Card'}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Speaker Name *</label>
                <input
                  type="text"
                  value={editingSpeaker.name}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, name: e.target.value })}
                  placeholder="e.g. Marcus Chen"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role / Title *</label>
                <input
                  type="text"
                  value={editingSpeaker.role}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, role: e.target.value })}
                  placeholder="e.g. Managing Director, Applied AI"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company / Organization *</label>
                <input
                  type="text"
                  value={editingSpeaker.company}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, company: e.target.value })}
                  placeholder="e.g. JP Morgan Chase or Goldman Sachs"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Profile Picture URL</label>
                <input
                  type="url"
                  value={editingSpeaker.photoUrl}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... or image URL"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={editingSpeaker.linkedinUrl || ''}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bio (Short)</label>
                <textarea
                  rows={3}
                  value={editingSpeaker.bio || ''}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, bio: e.target.value })}
                  placeholder="Brief background and conference topic..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingSpeaker(null)}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSpeaker}
                className="px-5 py-2 rounded-xl bg-[#FF6700] hover:bg-[#FF7700] text-white text-sm font-bold shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: EDIT / ADD SCHEDULE ITEM
      ────────────────────────────────────────────────────────────────────────────── */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {isNewSchedule ? 'Add Schedule Session' : 'Edit Schedule Session'}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Time Slot *</label>
                <input
                  type="text"
                  value={editingSchedule.time}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value })}
                  placeholder="e.g. 10:45 AM - 12:00 PM"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Session Title *</label>
                <input
                  type="text"
                  value={editingSchedule.title}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, title: e.target.value })}
                  placeholder="e.g. AI in Finance & Banking Systems"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location / Room</label>
                <input
                  type="text"
                  value={editingSchedule.location || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, location: e.target.value })}
                  placeholder="e.g. Robertson Auditorium"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingSchedule.description || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, description: e.target.value })}
                  placeholder="Details about topics covered..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2 rounded-xl bg-[#00274c] hover:bg-[#0e3b6e] text-white text-sm font-bold shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: EDIT / ADD SPONSOR
      ────────────────────────────────────────────────────────────────────────────── */}
      {editingSponsor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {isNewSponsor ? 'Add Sponsor' : 'Edit Sponsor'}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sponsor / Partner Name *</label>
                <input
                  type="text"
                  value={editingSponsor.name}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, name: e.target.value })}
                  placeholder="e.g. Goldman Sachs"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tier</label>
                <select
                  value={editingSponsor.tier}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, tier: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                >
                  <option value="Title">Title Partner</option>
                  <option value="Platinum">Platinum Partner</option>
                  <option value="Gold">Gold Partner</option>
                  <option value="Silver">Silver Partner</option>
                  <option value="Partner">General Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Logo Image URL</label>
                <input
                  type="text"
                  value={editingSponsor.logoUrl}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, logoUrl: e.target.value })}
                  placeholder="/rossLogo.png or https://..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                <input
                  type="url"
                  value={editingSponsor.websiteUrl || ''}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, websiteUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingSponsor(null)}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSponsor}
                className="px-5 py-2 rounded-xl bg-[#00274c] hover:bg-[#0e3b6e] text-white text-sm font-bold shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
