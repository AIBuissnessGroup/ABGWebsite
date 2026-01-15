'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from './layout';
import type { RecruitmentCycle, CycleSettings } from '@/types/recruitment';

export default function CycleSettingsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle, refreshCycle } = useCycle();
  const { put } = useAdminApi();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    portalOpenAt: '',
    portalCloseAt: '',
    applicationDueAt: '',
    isActive: false,
    settings: {
      requireResume: true,
      requireHeadshot: true,
      allowTrackChange: false,
      maxApplicationsPerUser: 1,
      googleCalendarId: '',
      emailFromName: '',
      emailReplyTo: '',
    } as CycleSettings,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cycle) {
      setFormData({
        name: cycle.name,
        slug: cycle.slug,
        portalOpenAt: formatDateForInput(new Date(cycle.portalOpenAt)),
        portalCloseAt: formatDateForInput(new Date(cycle.portalCloseAt)),
        applicationDueAt: formatDateForInput(new Date(cycle.applicationDueAt)),
        isActive: cycle.isActive,
        settings: {
          ...cycle.settings, // Preserve existing settings like recruitmentConnects, tracks, etc.
          requireResume: cycle.settings?.requireResume ?? true,
          requireHeadshot: cycle.settings?.requireHeadshot ?? true,
          allowTrackChange: cycle.settings?.allowTrackChange ?? false,
          googleCalendarId: cycle.settings?.googleCalendarId ?? '',
          emailFromName: cycle.settings?.emailFromName ?? '',
          emailReplyTo: cycle.settings?.emailReplyTo ?? '',
        },
      });
    }
  }, [cycle]);

  // Format date for datetime-local input (displays in local timezone)
  const formatDateForInput = (date: Date): string => {
    // Get local date/time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Parse datetime-local input and convert to ISO string preserving the intended time
  const parseLocalDateToISO = (localDateStr: string): string => {
    // The datetime-local input gives us a string like "2026-01-15T11:00"
    // We need to interpret this as EST/EDT and store properly
    // Create date from local string - browser interprets as local timezone
    const date = new Date(localDateStr);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await put(`/api/admin/recruitment/cycles/${cycleId}`, {
        ...formData,
        portalOpenAt: new Date(formData.portalOpenAt).toISOString(),
        portalCloseAt: new Date(formData.portalCloseAt).toISOString(),
        applicationDueAt: new Date(formData.applicationDueAt).toISOString(),
      }, {
        successMessage: 'Settings saved successfully',
      });
      refreshCycle();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!cycle) return null;

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active cycle (shown on portal.abgumich.org)
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              All times in Eastern Time (ET)
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal Opens - Date</label>
              <input
                type="date"
                value={formData.portalOpenAt.split('T')[0]}
                onChange={(e) => {
                  const time = formData.portalOpenAt.split('T')[1] || '09:00';
                  setFormData({ ...formData, portalOpenAt: `${e.target.value}T${time}` });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal Opens - Time</label>
              <input
                type="time"
                value={formData.portalOpenAt.split('T')[1] || '09:00'}
                onChange={(e) => {
                  const date = formData.portalOpenAt.split('T')[0];
                  setFormData({ ...formData, portalOpenAt: `${date}T${e.target.value}` });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">When applicants can access the portal</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline - Date</label>
              <input
                type="date"
                value={formData.applicationDueAt.split('T')[0]}
                onChange={(e) => {
                  const time = formData.applicationDueAt.split('T')[1] || '23:59';
                  setFormData({ ...formData, applicationDueAt: `${e.target.value}T${time}` });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline - Time</label>
              <input
                type="time"
                value={formData.applicationDueAt.split('T')[1] || '23:59'}
                onChange={(e) => {
                  const date = formData.applicationDueAt.split('T')[0];
                  setFormData({ ...formData, applicationDueAt: `${date}T${e.target.value}` });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Final deadline for application submission</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal Closes - Date</label>
              <input
                type="date"
                value={formData.portalCloseAt.split('T')[0]}
                onChange={(e) => {
                  const time = formData.portalCloseAt.split('T')[1] || '23:59';
                  setFormData({ ...formData, portalCloseAt: `${e.target.value}T${time}` });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal Closes - Time</label>
              <input
                type="time"
                value={formData.portalCloseAt.split('T')[1] || '23:59'}
                onChange={(e) => {
                  const date = formData.portalCloseAt.split('T')[0];
                  setFormData({ ...formData, portalCloseAt: `${date}T${e.target.value}` });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">When portal access ends entirely</p>
        </div>

        {/* Application Settings */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Application Settings</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireResume"
                checked={formData.settings.requireResume}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, requireResume: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="requireResume" className="text-sm text-gray-700">
                Require resume upload
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireHeadshot"
                checked={formData.settings.requireHeadshot}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, requireHeadshot: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="requireHeadshot" className="text-sm text-gray-700">
                Require headshot upload
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowTrackChange"
                checked={formData.settings.allowTrackChange}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowTrackChange: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowTrackChange" className="text-sm text-gray-700">
                Allow applicants to change track after starting
              </label>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
          <p className="text-sm text-gray-500 -mt-2">Configure outgoing recruitment emails</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email From Name</label>
            <input
              type="text"
              value={formData.settings.emailFromName || ''}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, emailFromName: e.target.value }
              })}
              placeholder="ABG Recruitment"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Display name for outgoing emails</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Reply-To</label>
            <input
              type="email"
              value={formData.settings.emailReplyTo || ''}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, emailReplyTo: e.target.value }
              })}
              placeholder="recruitment@abgumich.org"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Where replies to recruitment emails will go</p>
          </div>
        </div>

        {/* Calendar Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Calendar Integration</h3>
              <p className="text-sm text-blue-700 mt-1">
                Events and interview slots include an &quot;Add to Google Calendar&quot; link that applicants can click to save the event to their personal calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
