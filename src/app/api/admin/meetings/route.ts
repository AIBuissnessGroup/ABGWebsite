import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getAllMeetings, createMeeting } from '@/lib/meetings';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetings = await getAllMeetings();
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, date, category } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Meeting name is required' }, { status: 400 });
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Meeting date is required' }, { status: 400 });
    }

    const meeting = await createMeeting({
      name,
      date,
      category,
      createdBy: session.user.email,
    });

    const { ip, userAgent } = getRequestMetadata(request);
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.created' as any,
      'Meeting',
      {
        targetId: meeting.id,
        meta: { name: meeting.name, date: meeting.date, category: meeting.category },
        ip,
        userAgent,
      }
    );

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
