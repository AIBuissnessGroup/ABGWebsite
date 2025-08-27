'use client';
import { useEffect, useState } from 'react';

export default function AdminRecruitmentTimelinePage() {
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/recruitment/timeline');
        const data = await res.json();
        setTimeline(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    if (!timeline) return;
    setSaving(true);
    try {
      await fetch('/api/admin/recruitment/timeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeline),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="glass-card p-6">Loading...</div>;
  if (!timeline) return <div className="glass-card p-6">Failed to load content.</div>;

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="block mb-1 text-white">Hero Title</label>
          <input className="newsletter-input" value={timeline.heroTitle} onChange={(e) => setTimeline({ ...timeline, heroTitle: e.target.value })} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-white">Open Round Title</label>
            <input className="newsletter-input" value={timeline.openRoundTitle} onChange={(e) => setTimeline({ ...timeline, openRoundTitle: e.target.value })} />
            <label className="block mt-3 mb-1 text-white">Open Items (one per line)</label>
            <textarea className="newsletter-input" rows={10} value={(timeline.openItems || []).join('\n')} onChange={(e) => setTimeline({ ...timeline, openItems: e.target.value.split('\n') })} />
          </div>
          <div>
            <label className="block mb-1 text-white">Closed Round Title</label>
            <input className="newsletter-input" value={timeline.closedRoundTitle} onChange={(e) => setTimeline({ ...timeline, closedRoundTitle: e.target.value })} />
            <label className="block mt-3 mb-1 text-white">Closed Items (one per line)</label>
            <textarea className="newsletter-input" rows={10} value={(timeline.closedItems || []).join('\n')} onChange={(e) => setTimeline({ ...timeline, closedItems: e.target.value.split('\n') })} />
          </div>
        </div>
        <button className="newsletter-button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}


