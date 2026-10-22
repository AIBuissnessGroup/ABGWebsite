'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { ClipboardDocumentIcon, QrCodeIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ConferenceCheckinStaff } from '@/types/conference';

const CHECKIN_PATH = '/conference/checkin';

// Admin controls for who (besides admins) can use the mobile check-in page on conference day
export default function AdminCheckinStaffTab({
  value,
  saving,
  onSave,
}: {
  value?: ConferenceCheckinStaff[];
  saving: boolean;
  onSave: (staff: ConferenceCheckinStaff[]) => void;
}) {
  const { data: session } = useSession();
  const staff = value || [];
  const [input, setInput] = useState('');

  const checkinUrl = typeof window !== 'undefined' ? `${window.location.origin}${CHECKIN_PATH}` : CHECKIN_PATH;

  // Accepts one or more emails separated by commas, spaces or new lines
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = input
      .split(/[\s,;]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return;

    const invalid = emails.filter((x) => !/^[^\s@]+@umich\.edu$/.test(x));
    if (invalid.length) {
      toast.error(`Only @umich.edu accounts can sign in: ${invalid.join(', ')}`);
      return;
    }

    const existing = new Set(staff.map((s) => s.email.toLowerCase()));
    const fresh = emails.filter((x) => !existing.has(x));
    if (fresh.length === 0) {
      toast('Already on the list');
      return;
    }

    onSave([
      ...staff,
      ...fresh.map((email) => ({ email, addedBy: session?.user?.email || 'admin', addedAt: Date.now() })),
    ]);
    setInput('');
  };

  const handleRemove = (email: string) => {
    onSave(staff.filter((s) => s.email.toLowerCase() !== email.toLowerCase()));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
      toast.success('Check-in link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00274c] flex items-center justify-center flex-shrink-0">
            <QrCodeIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Check-in Staff</h3>
            <p className="text-sm text-gray-500">
              People on this list can open the mobile check-in page and scan or look up attendees, without being admins. Admins always have
              access. Staff access ends automatically at 11:59 PM ET on Friday, Oct 23.
            </p>
          </div>
        </div>
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold flex-shrink-0"
        >
          <ClipboardDocumentIcon className="w-4 h-4" />
          <span>Copy check-in link</span>
        </button>
      </div>

      <form onSubmit={handleAdd} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
        <label className="block text-sm font-bold text-gray-900">Add people</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="uniqname@umich.edu (separate several with commas)"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#00274c]"
          />
          <button
            type="submit"
            disabled={saving || !input.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] disabled:opacity-50 text-white text-sm font-bold shadow-sm"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Add'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Send them the check-in link. They sign in with Google using their umich account and can start checking people in right away.
        </p>
      </form>

      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 text-sm font-bold text-gray-900">
          {staff.length} {staff.length === 1 ? 'person' : 'people'} assigned
        </div>
        {staff.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">No check-in staff yet. Only admins can check people in.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {staff.map((s) => (
              <li key={s.email} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{s.email}</div>
                  {(s.addedBy || s.addedAt) && (
                    <div className="text-xs text-gray-400">
                      Added{s.addedBy ? ` by ${s.addedBy}` : ''}
                      {s.addedAt ? ` · ${new Date(s.addedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(s.email)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs font-bold disabled:opacity-50"
                  aria-label={`Remove ${s.email}`}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
