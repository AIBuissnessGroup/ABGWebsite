'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';

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

function RecruitmentAdmin() {
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
    <div className="min-h-screen bg-[#00274c] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Recruitment Management</h1>
        
        <div className="mb-6 flex gap-2">
          <button 
            className={`px-4 py-2 rounded-lg border transition-all font-medium ${tab === 'levels' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/10 border-white/30 text-white/90 hover:bg-white/20'}`} 
            onClick={() => setTab('levels')}
          >
            Member Levels
          </button>
          <button 
            className={`px-4 py-2 rounded-lg border transition-all font-medium ${tab === 'timeline' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/10 border-white/30 text-white/90 hover:bg-white/20'}`} 
            onClick={() => setTab('timeline')}
          >
            Timeline
          </button>
          <button 
            className={`px-4 py-2 rounded-lg border transition-all font-medium ${tab === 'coffee' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/10 border-white/30 text-white/90 hover:bg-white/20'}`} 
            onClick={() => setTab('coffee')}
          >
            Coffee Chats
          </button>
        </div>

      {tab === 'levels' && levels && (
        <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl p-6 space-y-4">
          <div>
            <label className="block mb-2 text-white font-semibold">Hero Title</label>
            <input 
              className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
              value={levels.heroTitle} 
              onChange={(e) => setLevels({ ...levels, heroTitle: e.target.value })} 
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-white font-semibold">General Title</label>
              <input 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                value={levels.generalTitle} 
                onChange={(e) => setLevels({ ...levels, generalTitle: e.target.value })} 
              />
              <label className="block mt-4 mb-2 text-white font-semibold">General Bullets (one per line)</label>
              <textarea 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                rows={6} 
                value={(levels.generalBullets || []).join('\n')} 
                onChange={(e) => setLevels({ ...levels, generalBullets: e.target.value.split('\n') })} 
              />
            </div>
            <div>
              <label className="block mb-2 text-white font-semibold">Project Title</label>
              <input 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                value={levels.projectTitle} 
                onChange={(e) => setLevels({ ...levels, projectTitle: e.target.value })} 
              />
              <label className="block mt-4 mb-2 text-white font-semibold">Project Bullets (one per line)</label>
              <textarea 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                rows={6} 
                value={(levels.projectBullets || []).join('\n')} 
                onChange={(e) => setLevels({ ...levels, projectBullets: e.target.value.split('\n') })} 
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-white font-semibold">Footer (one line per paragraph)</label>
            <textarea 
              className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
              rows={4} 
              value={(levels.footerLines || []).join('\n')} 
              onChange={(e) => setLevels({ ...levels, footerLines: e.target.value.split('\n') })} 
            />
          </div>
          <div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg px-6 py-3 text-white font-semibold transition-all duration-300 shadow-lg" 
              onClick={saveLevels}
            >
              Save Member Levels
            </button>
          </div>
        </div>
      )}

      {tab === 'timeline' && timeline && (
        <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl p-6 space-y-4">
          <div>
            <label className="block mb-2 text-white font-semibold">Hero Title</label>
            <input 
              className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
              value={timeline.heroTitle} 
              onChange={(e) => setTimeline({ ...timeline, heroTitle: e.target.value })} 
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-white font-semibold">Open Round Title</label>
              <input 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                value={timeline.openRoundTitle} 
                onChange={(e) => setTimeline({ ...timeline, openRoundTitle: e.target.value })} 
              />
              <label className="block mt-4 mb-2 text-white font-semibold">Open Items (one per line)</label>
              <textarea 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                rows={8} 
                value={(timeline.openItems || []).join('\n')} 
                onChange={(e) => setTimeline({ ...timeline, openItems: e.target.value.split('\n') })} 
              />
            </div>
            <div>
              <label className="block mb-2 text-white font-semibold">Closed Round Title</label>
              <input 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                value={timeline.closedRoundTitle} 
                onChange={(e) => setTimeline({ ...timeline, closedRoundTitle: e.target.value })} 
              />
              <label className="block mt-4 mb-2 text-white font-semibold">Closed Items (one per line)</label>
              <textarea 
                className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                rows={8} 
                value={(timeline.closedItems || []).join('\n')} 
                onChange={(e) => setTimeline({ ...timeline, closedItems: e.target.value.split('\n') })} 
              />
            </div>
          </div>
          <div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg px-6 py-3 text-white font-semibold transition-all duration-300 shadow-lg" 
              onClick={saveTimeline}
            >
              Save Timeline
            </button>
          </div>
        </div>
      )}

      {tab === 'coffee' && (
        <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold text-lg">Coffee Chat Slots</h3>
            <button 
              className="px-4 py-2 rounded-lg border border-blue-400/50 bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium" 
              onClick={() => setEditing({ title: 'Coffee Chat', capacity: 1, isOpen: true })}
            >
              New Slot
            </button>
          </div>
          <div className="space-y-3">
            {slots.map((s) => (
              <div key={s.id} className="p-4 border border-white/30 rounded-lg bg-white/10">
                <div className="text-white font-semibold text-lg">{s.title}</div>
                <div className="text-white/80 text-sm mt-1">{new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleString()}</div>
                <div className="text-white/80 text-sm">{s.location} • Host: {s.hostName}</div>
                <div className="mt-3 flex gap-2">
                  <button 
                    className="px-3 py-1 rounded border border-blue-400/50 bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-medium" 
                    onClick={() => setEditing(s)}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-3 py-1 rounded border border-red-400/50 bg-red-600 text-white hover:bg-red-700 transition-all text-sm font-medium" 
                    onClick={() => deleteSlot(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="mt-6 p-4 border border-white/40 rounded-lg bg-white/20 space-y-4">
              <h4 className="text-white font-semibold">
                {editing.id ? 'Edit Coffee Chat Slot' : 'Create New Coffee Chat Slot'}
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  placeholder="Title" 
                  value={editing.title || ''} 
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })} 
                />
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  placeholder="Location" 
                  value={editing.location || ''} 
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })} 
                />
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  placeholder="Host Name" 
                  value={editing.hostName || ''} 
                  onChange={(e) => setEditing({ ...editing, hostName: e.target.value })} 
                />
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  placeholder="Host Email" 
                  value={editing.hostEmail || ''} 
                  onChange={(e) => setEditing({ ...editing, hostEmail: e.target.value })} 
                />
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  placeholder="Start Time (YYYY-MM-DD HH:MM)" 
                  value={editing.startTime || ''} 
                  onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} 
                />
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  placeholder="End Time (YYYY-MM-DD HH:MM)" 
                  value={editing.endTime || ''} 
                  onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} 
                />
                <input 
                  className="w-full border border-white/30 rounded-lg px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50" 
                  type="number" 
                  placeholder="Capacity" 
                  value={editing.capacity?.toString() || '1'} 
                  onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} 
                />
                <label className="text-white flex items-center gap-3 p-3 font-medium">
                  <input 
                    type="checkbox" 
                    checked={!!editing.isOpen} 
                    onChange={(e) => setEditing({ ...editing, isOpen: e.target.checked })}
                    className="w-4 h-4 accent-blue-500" 
                  />
                  Open for signup
                </label>
              </div>
              <div className="flex gap-3">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg px-6 py-3 text-white font-semibold transition-all duration-300 shadow-lg" 
                  onClick={saveSlot}
                >
                  {editing.id ? 'Update Slot' : 'Create Slot'}
                </button>
                <button 
                  className="px-6 py-3 rounded-lg border border-white/40 bg-white/20 text-white hover:bg-white/30 transition-all font-medium" 
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      </div>
    </div>
  );
}

export default withAdminPageProtection(RecruitmentAdmin, 'recruitment');


