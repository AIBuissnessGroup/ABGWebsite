import { getDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { buildIcs, type CalendarItem } from '@/lib/calendar-links';

export const dynamic = 'force-dynamic';

const TWO_HOURS = 2 * 60 * 60 * 1000;

// Subscribable iCalendar feed of published events (Google Calendar "From URL", Apple/Outlook).
export async function GET() {
  let events: any[];
  try {
    const db = await getDb('abg-website');
    events = await db
      .collection('Event')
      .find({ published: { $in: [true, 1] } })
      .sort({ eventDate: 1 })
      .toArray();
  } catch (error) {
    console.error('Error building events calendar feed:', error);
    return new NextResponse('Failed to build calendar', { status: 500 });
  }

  const items: CalendarItem[] = [];
  for (const e of events) {
    const start = new Date(e.eventDate);
    if (isNaN(start.getTime())) continue;
    const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + TWO_HOURS);
    items.push({
      id: String(e.id ?? e._id),
      title: e.title,
      start,
      end: isNaN(end.getTime()) || end <= start ? new Date(start.getTime() + TWO_HOURS) : end,
      description: e.description,
      location: [e.venue, e.location].filter(Boolean).join(', ') || undefined,
    });
  }

  return new NextResponse(buildIcs(items, 'ABG at Michigan Events'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
