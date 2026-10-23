'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { ClipboardDocumentIcon, SignalIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ConferenceCheckinStaff } from '@/types/conference';

// Admin controls for who can drive the live stage screens from the /conference/control remote
export default function AdminStageControllersSection({
  value,
  saving,
  onSave,
}: {
  value?: ConferenceCheckinStaff[];
  saving: boolean;
  onSave: (controllers: ConferenceCheckinStaff[]) => void;
}) {
  const { data: session } = useSession();
  const controllers = value || [];
  const [input, setInput] = useState('');

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
    const existing = new Set(controllers.map((c) => c.email.toLowerCase()));
    const fresh = emails.filter((x) => !existing.has(x));
    if (fresh.length === 0) {
      toast('Already on the list');
      return;
    }
    onSave([...controllers, ...fresh.map((email) => ({ email, addedBy: session?.user?.email || 'admin', addedAt: Date.now() }))]);
    setInput('');
  };

  const copy = async (path: string, label: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00274c] flex items-center justify-center flex-shrink-0">
            <SignalIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stage Remote Access</h3>
            <p className="text-sm text-gray-500">
              Admins listed here can run the live stage screens from their phones: switch slides, start and adjust the countdown, and show or
              hide the Up next bar. They must also be admins.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={() => copy('/conference/control', 'Remote link')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold"
          >
            <ClipboardDocumentIcon className="w-4 h-4" /> Remote link
          </button>
          <button
            onClick={() => copy('/conference/background?live=1', 'Live screen link')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold"
          >
            <ClipboardDocumentIcon className="w-4 h-4" /> Live screen link
          </button>
        </div>
      </div>

      {controllers.length === 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          No one is listed yet, so any admin can use the remote. Add people to limit it to them.
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
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
      </form>

      {controllers.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {controllers.map((c) => (
            <li key={c.email} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm font-semibold text-gray-900 truncate">{c.email}</span>
              <button
                onClick={() => onSave(controllers.filter((x) => x.email !== c.email))}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs font-bold disabled:opacity-50"
                aria-label={`Remove ${c.email}`}
              >
                <TrashIcon className="w-3.5 h-3.5" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
