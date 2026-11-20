'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { downloadIcs, googleCalendarUrl, type CalendarItem } from '@/lib/calendar-links';

interface EventCalendarProps {
  items: CalendarItem[];
  /** 'dark' for the navy public pages, 'light' for the portal. */
  theme?: 'dark' | 'light';
  /** Path of an .ics feed; adds a "Add to Google Calendar" subscribe button. */
  feedPath?: string;
}

type View = 'month' | 'week';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS_PER_DAY = 3;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function EventCalendar({ items, theme = 'dark', feedPath }: EventCalendarProps) {
  const dark = theme === 'dark';
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const today = startOfDay(new Date());

  // Bucket events by every day they touch, so multi-day events show on each day.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const last = startOfDay(new Date(Math.max(item.end.getTime() - 1, item.start.getTime())));
      for (let d = startOfDay(item.start); d <= last; d = addDays(d, 1)) {
        const key = dayKey(d);
        map.set(key, [...(map.get(key) ?? []), item]);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.start.getTime() - b.start.getTime());
    return map;
  }, [items]);

  const days = useMemo(() => {
    if (view === 'week') {
      const weekStart = addDays(cursor, -cursor.getDay());
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = addDays(first, -first.getDay());
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const rows = Math.ceil((first.getDay() + daysInMonth) / 7);
    return Array.from({ length: rows * 7 }, (_, i) => addDays(gridStart, i));
  }, [cursor, view]);

  const step = (dir: -1 | 1) => {
    setCursor((c) =>
      view === 'week'
        ? addDays(c, dir * 7)
        : new Date(c.getFullYear(), c.getMonth() + dir, 1),
    );
  };

  const title =
    view === 'month'
      ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const c = {
    panel: dark ? 'bg-white/5 border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900',
    muted: dark ? 'text-blue-200' : 'text-gray-500',
    cell: dark ? 'border-white/10' : 'border-gray-200',
    cellOut: dark ? 'bg-black/10 text-white/40' : 'bg-gray-50 text-gray-400',
    btn: dark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    btnOn: dark ? 'bg-white text-[#00274c]' : 'bg-[#00274c] text-white',
    chip: dark ? 'bg-[#ffcb05] text-[#00274c]' : 'bg-[#00274c] text-white',
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-6 ${c.panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button aria-label="Previous" onClick={() => step(-1)} className={`p-2 rounded-lg ${c.btn}`}>
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button aria-label="Next" onClick={() => step(1)} className={`p-2 rounded-lg ${c.btn}`}>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setCursor(today)} className={`px-3 py-2 rounded-lg text-sm font-medium ${c.btn}`}>
            Today
          </button>
          <h3 className="ml-2 text-lg sm:text-xl font-bold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {(['month', 'week'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${view === v ? c.btnOn : c.btn}`}
            >
              {v}
            </button>
          ))}
          {feedPath && (
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
                `webcal://${typeof window !== 'undefined' ? window.location.host : ''}${feedPath}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#ffcb05] text-[#00274c] hover:bg-[#ffd633]"
            >
              Add to Google Calendar
            </a>
          )}
          <button
            onClick={() => downloadIcs(items)}
            disabled={items.length === 0}
            className={`px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 ${c.btn}`}
          >
            Export .ics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className={`py-1 ${c.muted}`}>{w}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 border-l border-t ${c.cell}`}>
        {days.map((day) => {
          const inMonth = view === 'week' || day.getMonth() === cursor.getMonth();
          const list = byDay.get(dayKey(day)) ?? [];
          const shown = view === 'week' ? list : list.slice(0, MAX_CHIPS_PER_DAY);
          const isToday = sameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b p-1 sm:p-1.5 ${c.cell} ${inMonth ? '' : c.cellOut} ${
                view === 'week' ? 'min-h-[220px]' : 'min-h-[84px] sm:min-h-[110px]'
              }`}
            >
              <div
                className={`text-xs sm:text-sm mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-[#ffcb05] text-[#00274c] font-bold' : ''
                }`}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {shown.map((item) => (
                  <button
                    key={`${item.id}-${dayKey(day)}`}
                    onClick={() => setSelected(item)}
                    className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] sm:text-xs font-medium ${c.chip}`}
                    title={item.title}
                  >
                    {sameDay(item.start, day) && <span className="opacity-70 mr-1 hidden sm:inline">{formatTime(item.start)}</span>}
                    {item.title}
                  </button>
                ))}
                {list.length > shown.length && (
                  <button
                    onClick={() => { setView('week'); setCursor(day); }}
                    className={`text-[11px] px-1 ${c.muted} hover:underline`}
                  >
                    +{list.length - shown.length} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h4 className="pr-6 text-xl font-bold text-[#00274c]">{selected.title}</h4>
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <CalendarDaysIcon className="w-4 h-4 shrink-0" />
              {selected.start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}
              {formatTime(selected.start)} – {formatTime(selected.end)}
            </p>
            {selected.location && (
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4 shrink-0" />
                {selected.location}
              </p>
            )}
            {selected.description && (
              <p className="mt-3 line-clamp-5 text-sm text-gray-700">{selected.description}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.href && (
                <Link href={selected.href} className="rounded-lg bg-[#00274c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a70]">
                  View details
                </Link>
              )}
              <a
                href={googleCalendarUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
              >
                Google Calendar
              </a>
              <button
                onClick={() => downloadIcs([selected], `${selected.id}.ics`)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
              >
                Download .ics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
