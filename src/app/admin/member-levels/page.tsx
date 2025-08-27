'use client';
import { useEffect, useState } from 'react';

export default function AdminMemberLevelsPage() {
  const [levels, setLevels] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/recruitment/member-levels');
        const data = await res.json();
        setLevels(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    if (!levels) return;
    setSaving(true);
    try {
      await fetch('/api/admin/recruitment/member-levels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(levels),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="glass-card p-6">Loading...</div>;
  if (!levels) return <div className="glass-card p-6">Failed to load content.</div>;

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="block mb-1 text-white">Hero Title</label>
          <input className="newsletter-input" value={levels.heroTitle} onChange={(e) => setLevels({ ...levels, heroTitle: e.target.value })} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-white">General Title</label>
            <input className="newsletter-input" value={levels.generalTitle} onChange={(e) => setLevels({ ...levels, generalTitle: e.target.value })} />
            <label className="block mt-3 mb-1 text-white">General Bullets (one per line)</label>
            <textarea className="newsletter-input" rows={8} value={(levels.generalBullets || []).join('\n')} onChange={(e) => setLevels({ ...levels, generalBullets: e.target.value.split('\n') })} />
          </div>
          <div>
            <label className="block mb-1 text-white">Project Title</label>
            <input className="newsletter-input" value={levels.projectTitle} onChange={(e) => setLevels({ ...levels, projectTitle: e.target.value })} />
            <label className="block mt-3 mb-1 text-white">Project Bullets (one per line)</label>
            <textarea className="newsletter-input" rows={8} value={(levels.projectBullets || []).join('\n')} onChange={(e) => setLevels({ ...levels, projectBullets: e.target.value.split('\n') })} />
          </div>
        </div>
        <div>
          <label className="block mb-1 text-white">Footer (one line per paragraph)</label>
          <textarea className="newsletter-input" rows={6} value={(levels.footerLines || []).join('\n')} onChange={(e) => setLevels({ ...levels, footerLines: e.target.value.split('\n') })} />
        </div>
        <button className="newsletter-button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}


