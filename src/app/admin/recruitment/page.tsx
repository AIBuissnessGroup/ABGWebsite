'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

type Slot = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  hostName: string;
  hostEmail: string;
  capacity: number;
  isOpen: boolean;
};

export default function RecruitmentAdmin() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<'levels' | 'timeline' | 'coffee'>('levels');
  const [levels, setLevels] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState<Partial<Slot> | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) redirect('/auth/signin');
  }, [session, status]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [levelsRes, timelineRes, slotsRes] = await Promise.all([
      fetch('/api/admin/recruitment/member-levels'),
      fetch('/api/admin/recruitment/timeline'),
      fetch('/api/admin/recruitment/coffee-chats'),
    ]);
    setLevels(await levelsRes.json());
    setTimeline(await timelineRes.json());
    setSlots(await slotsRes.json());
  };

  const saveLevels = async () => {
    await fetch('/api/admin/recruitment/member-levels', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(levels) });
    await loadAll();
  };
  const saveTimeline = async () => {
    await fetch('/api/admin/recruitment/timeline', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(timeline) });
    await loadAll();
  };

  const saveSlot = async () => {
    if (!editing) return;
    const method = editing.id ? 'PUT' : 'POST';
    await fetch('/api/admin/recruitment/coffee-chats', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setEditing(null);
    await loadAll();
  };

  const deleteSlot = async (id: string) => {
    await fetch(`/api/admin/recruitment/coffee-chats?id=${id}`, { method: 'DELETE' });
    await loadAll();
  };

  return (
    <div className="admin-page">
      <div className="mb-4 flex gap-2">
        <button className={`btn-secondary ${tab === 'levels' ? 'bg-white/20' : ''}`} onClick={() => setTab('levels')} style={{color: 'white'}}>Member Levels</button>
        <button className={`btn-secondary ${tab === 'timeline' ? 'bg-white/20' : ''}`} onClick={() => setTab('timeline')} style={{color: 'white'}}>Timeline</button>
        <button className={`btn-secondary ${tab === 'coffee' ? 'bg-white/20' : ''}`} onClick={() => setTab('coffee')} style={{color: 'white'}}>Coffee Chats</button>
      </div>

      {tab === 'levels' && levels && (
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
              <textarea className="newsletter-input" rows={6} value={(levels.generalBullets || []).join('\n')} onChange={(e) => setLevels({ ...levels, generalBullets: e.target.value.split('\n') })} />
            </div>
            <div>
              <label className="block mb-1 text-white">Project Title</label>
              <input className="newsletter-input" value={levels.projectTitle} onChange={(e) => setLevels({ ...levels, projectTitle: e.target.value })} />
              <label className="block mt-3 mb-1 text-white">Project Bullets (one per line)</label>
              <textarea className="newsletter-input" rows={6} value={(levels.projectBullets || []).join('\n')} onChange={(e) => setLevels({ ...levels, projectBullets: e.target.value.split('\n') })} />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-white">Footer (one line per paragraph)</label>
            <textarea className="newsletter-input" rows={4} value={(levels.footerLines || []).join('\n')} onChange={(e) => setLevels({ ...levels, footerLines: e.target.value.split('\n') })} />
          </div>
          <div>
            <button className="newsletter-button" onClick={saveLevels}>Save</button>
          </div>
        </div>
      )}

      {tab === 'timeline' && timeline && (
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
              <textarea className="newsletter-input" rows={8} value={(timeline.openItems || []).join('\n')} onChange={(e) => setTimeline({ ...timeline, openItems: e.target.value.split('\n') })} />
            </div>
            <div>
              <label className="block mb-1 text-white">Closed Round Title</label>
              <input className="newsletter-input" value={timeline.closedRoundTitle} onChange={(e) => setTimeline({ ...timeline, closedRoundTitle: e.target.value })} />
              <label className="block mt-3 mb-1 text-white">Closed Items (one per line)</label>
              <textarea className="newsletter-input" rows={8} value={(timeline.closedItems || []).join('\n')} onChange={(e) => setTimeline({ ...timeline, closedItems: e.target.value.split('\n') })} />
            </div>
          </div>
          <div>
            <button className="newsletter-button" onClick={saveTimeline}>Save</button>
          </div>
        </div>
      )}

      {tab === 'coffee' && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Coffee Chat Slots</h3>
            <button className="btn-secondary" style={{color: 'white'}} onClick={() => setEditing({ title: 'Coffee Chat', capacity: 1, isOpen: true })}>New Slot</button>
          </div>
          <div className="space-y-3">
            {slots.map((s) => (
              <div key={s.id} className="p-3 border border-white/20 rounded">
                <div className="text-white font-medium">{s.title}</div>
                <div className="text-muted text-sm">{new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleString()}</div>
                <div className="text-muted text-sm">{s.location} • Host: {s.hostName}</div>
                <div className="mt-2 flex gap-2">
                  <button className="btn-secondary" style={{color: 'white'}} onClick={() => setEditing(s)}>Edit</button>
                  <button className="btn-secondary" style={{color: 'white'}} onClick={() => deleteSlot(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="mt-6 p-4 border border-white/30 rounded space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input className="newsletter-input" placeholder="Title" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                <input className="newsletter-input" placeholder="Location" value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
                <input className="newsletter-input" placeholder="Host Name" value={editing.hostName || ''} onChange={(e) => setEditing({ ...editing, hostName: e.target.value })} />
                <input className="newsletter-input" placeholder="Host Email" value={editing.hostEmail || ''} onChange={(e) => setEditing({ ...editing, hostEmail: e.target.value })} />
                <input className="newsletter-input" placeholder="Start Time (ISO)" value={editing.startTime || ''} onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} />
                <input className="newsletter-input" placeholder="End Time (ISO)" value={editing.endTime || ''} onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} />
                <input className="newsletter-input" type="number" placeholder="Capacity" value={editing.capacity?.toString() || '1'} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
                <label className="text-white flex items-center gap-2">
                  <input type="checkbox" checked={!!editing.isOpen} onChange={(e) => setEditing({ ...editing, isOpen: e.target.checked })} />
                  Open for signup
                </label>
              </div>
              <div className="flex gap-2">
                <button className="newsletter-button" onClick={saveSlot}>Save Slot</button>
                <button className="btn-secondary" style={{color: 'white'}} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


