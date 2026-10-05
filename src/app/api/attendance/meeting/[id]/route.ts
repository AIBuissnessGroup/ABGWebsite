import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMeetingById, recordMeetingAttendance } from '@/lib/meetings';
import { getRequestMetadata } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { meeting, attendees } = await getMeetingById(id);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email?.toLowerCase().trim();

    let alreadyCheckedIn = false;
    let userCheckedInAt: string | undefined;

    if (userEmail) {
      const existing = attendees.find((a) => a.userEmail.toLowerCase().trim() === userEmail);
      if (existing) {
        alreadyCheckedIn = true;
        userCheckedInAt = existing.checkedInAt;
      }
    }

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        name: meeting.name,
        date: meeting.date,
        category: meeting.category,
        isOpen: meeting.isOpen,
      },
      user: session?.user
        ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }
        : null,
      alreadyCheckedIn,
      userCheckedInAt,
    });
  } catch (error) {
    console.error('Error getting meeting checkin status:', error);
    return NextResponse.json({ error: 'Failed to retrieve meeting details' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in with your @umich.edu account to check in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { ip, userAgent } = getRequestMetadata(request);

    const result = await recordMeetingAttendance({
      meetingId: id,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email.split('@')[0],
      userRoles: session.user.roles || ['USER'],
      userId: session.user.id,
      ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to check in' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: result.alreadyCheckedIn || false,
      meeting: result.meeting,
      record: result.record,
    });
  } catch (error) {
    console.error('Error during meeting check-in:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during check-in.' }, { status: 500 });
  }
}
