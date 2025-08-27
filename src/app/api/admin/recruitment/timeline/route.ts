import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

let recruitmentTimelineContent = {
  heroTitle: 'RECRUITMENT TIMELINE F25',
  openRoundTitle: 'OPEN ROUND',
  openItems: [
    'FestiFall (Either August 25th or August 27th) & Meet the Clubs (September 2nd & 3rd)',
    'DATE TBD: Mass Meeting',
    'September 17th (Wednesday): Meet the Members, speed dating (7-8pm, 1 hour)',
    'September 18th-19th (Thursday-Friday): Coffee Chats (4-6pm, 20 mins)',
    'September 22nd (Monday): Case/Technical “workshop” (7-8pm, 1 hour)',
    'September 24th (Wednesday): APPLICATION DEADLINE 11:59pm',
  ],
  closedRoundTitle: 'CLOSED ROUND',
  closedItems: [
    'Interview: September 26th (Friday)',
    'Round 2 Interview: September 28th (Sunday) + DECISIONS RELEASED + INITIATION SOCIAL!!!',
  ],
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(recruitmentTimelineContent);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    recruitmentTimelineContent = { ...recruitmentTimelineContent, ...data, lastUpdated: new Date().toISOString() };
    return NextResponse.json(recruitmentTimelineContent);
  } catch (error) {
    console.error('Error updating timeline content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}


