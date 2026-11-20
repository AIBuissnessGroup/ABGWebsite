/**
 * Client-safe helpers for "Add to calendar" links and .ics downloads.
 * (Server-side Google Calendar API access lives in ./calendar.ts.)
 */

export interface CalendarItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  type?: string;
  href?: string;
}

const pad = (n: number) => n.toString().padStart(2, '0');

function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function googleCalendarUrl(item: CalendarItem): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${toUtcStamp(item.start)}/${toUtcStamp(item.end)}`,
  });
  if (item.description) params.set('details', item.description);
  if (item.location) params.set('location', item.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(items: CalendarItem[], calendarName?: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ABG at Michigan//Events//EN',
    'CALSCALE:GREGORIAN',
  ];
  if (calendarName) lines.push(`X-WR-CALNAME:${escapeIcs(calendarName)}`);
  for (const item of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id}@abgumich.org`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
      `DTSTART:${toUtcStamp(item.start)}`,
      `DTEND:${toUtcStamp(item.end)}`,
      `SUMMARY:${escapeIcs(item.title)}`,
    );
    if (item.description) lines.push(`DESCRIPTION:${escapeIcs(item.description)}`);
    if (item.location) lines.push(`LOCATION:${escapeIcs(item.location)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(items: CalendarItem[], filename = 'abg-events.ics') {
  const blob = new Blob([buildIcs(items)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
