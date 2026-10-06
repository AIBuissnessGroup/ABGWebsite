import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getMeetingById, updateMeeting, deleteMeeting } from '@/lib/meetings';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { meeting, attendees } = await getMeetingById(id);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Generate QR code on server for guaranteed reliability
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;
    const checkinUrl = `${baseUrl}/attendance/meeting/${meeting.id}`;

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 340,
        margin: 2,
        color: {
          dark: '#00274c',
          light: '#ffffff',
        },
      });
    } catch (qrErr) {
      console.error('Error generating QR code on server:', qrErr);
    }

    return NextResponse.json({
      meeting,
      attendees,
      qrCodeDataUrl,
      checkinUrl,
    });
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const success = await updateMeeting(id, body);
    if (!success) {
      return NextResponse.json({ error: 'Meeting not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteMeeting(id);

    if (!success) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const { ip, userAgent } = getRequestMetadata(request);
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.deleted' as any,
      'Meeting',
      {
        targetId: id,
        ip,
        userAgent,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
