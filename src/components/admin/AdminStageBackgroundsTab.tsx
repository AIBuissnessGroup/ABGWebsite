'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { SPEAKER_SESSIONS, applySpeakerOrder, LineupSession } from '@/lib/conference-lineup';

type OrderMap = Record<string, string[]>;

function buildOrder(value?: OrderMap): OrderMap {
  const map: OrderMap = {};
  for (const s of SPEAKER_SESSIONS) {
    map[s.id] = applySpeakerOrder(s, value?.[s.id]).speakers.map((sp) => sp.name);
  }
  return map;
}

// Admin controls for the speaker order shown on the /conference/background stage slides
export default function AdminStageBackgroundsTab({
  value,
  saving,
  onSave,
}: {
  value?: OrderMap;
  saving: boolean;
  onSave: (order: OrderMap) => void;
}) {
  const [order, setOrder] = useState<OrderMap>(() => buildOrder(value));
  const [dragging, setDragging] = useState<{ sessionId: string; name: string } | null>(null);

  useEffect(() => setOrder(buildOrder(value)), [value]);

  const saved = useMemo(() => buildOrder(value), [value]);
  const dirty = JSON.stringify(order) !== JSON.stringify(saved);

  const move = (sessionId: string, from: number, to: number) => {
    setOrder((prev) => {
      const list = [...prev[sessionId]];
      if (to < 0 || to >= list.length) return prev;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...prev, [sessionId]: list };
    });
  };

  const resetSession = (session: LineupSession) =>
    setOrder((prev) => ({ ...prev, [session.id]: session.speakers.map((sp) => sp.name) }));

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00274c] flex items-center justify-center flex-shrink-0">
            <ComputerDesktopIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stage Background Speaker Order</h3>
            <p className="text-sm text-gray-500">
              Arrange speakers left to right as they appear on the stage screens. Drag a speaker or use the arrows, then save. Screens that are
              already open update on their own within a few seconds, no reload needed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/conference/background"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            <span>All screens</span>
          </a>
          <button
            onClick={() => onSave(order)}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00274c] hover:bg-[#003366] disabled:opacity-50 text-white text-sm font-bold shadow-sm"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>{saving ? 'Saving...' : dirty ? 'Save Order' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {SPEAKER_SESSIONS.map((session) => {
        const names = order[session.id] || [];
        const byName = Object.fromEntries(session.speakers.map((sp) => [sp.name, sp]));
        const changed = JSON.stringify(names) !== JSON.stringify(saved[session.id]);

        return (
          <div key={session.id} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {session.label ? `${session.label} · ` : ''}
                  {session.start} · {session.room}
                  {changed && <span className="ml-2 text-amber-600">Unsaved</span>}
                </div>
                <div className="text-base font-bold text-gray-900">{session.headline.join(' ').replace(/\*/g, '')}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => resetSession(session)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-bold"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                  Default order
                </button>
                <a
                  href={`/conference/background?s=${session.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-bold"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  Preview
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {names.map((name, i) => {
                const sp = byName[name];
                if (!sp) return null;
                return (
                  <div
                    key={name}
                    draggable
                    onDragStart={() => setDragging({ sessionId: session.id, name })}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(e) => {
                      if (dragging?.sessionId === session.id) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!dragging || dragging.sessionId !== session.id) return;
                      move(session.id, names.indexOf(dragging.name), i);
                      setDragging(null);
                    }}
                    className={`w-36 rounded-xl border bg-gray-50 p-3 text-center cursor-grab active:cursor-grabbing transition-all ${
                      dragging?.name === name ? 'opacity-40 border-[#00274c]' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-gray-400 mb-1">#{i + 1}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sp.photo}
                      alt={sp.name}
                      draggable={false}
                      className="w-16 h-16 rounded-full object-cover mx-auto grayscale"
                      style={{ objectPosition: sp.photoPosition || 'center 20%' }}
                    />
                    <div className="mt-2 text-sm font-bold text-gray-900 leading-tight">{sp.name}</div>
                    <div className="text-[11px] text-gray-500 leading-snug line-clamp-2">{sp.company || sp.title}</div>
                    {sp.role === 'moderator' && (
                      <div className="mt-1 inline-block text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                        Moderator
                      </div>
                    )}
                    <div className="mt-2 flex justify-center gap-1">
                      <button
                        onClick={() => move(session.id, i, i - 1)}
                        disabled={i === 0}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-30 text-gray-600"
                        aria-label={`Move ${sp.name} left`}
                      >
                        <ArrowLeftIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => move(session.id, i, i + 1)}
                        disabled={i === names.length - 1}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-30 text-gray-600"
                        aria-label={`Move ${sp.name} right`}
                      >
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
