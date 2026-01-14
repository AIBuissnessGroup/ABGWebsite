/**
 * Recruitment RSVPs Admin API
 * GET - List RSVPs for an event
 * POST - Mark attendance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getRsvpsByEvent, markAttendance } from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';

// CORS helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return corsResponse(
        NextResponse.json({ error: 'eventId is required' }, { status: 400 })
      );
    }

    const rsvps = await getRsvpsByEvent(eventId);
    return corsResponse(NextResponse.json(rsvps));
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const data = await request.json();

    // Validate required fields
    if (!data.rsvpId) {
      return corsResponse(
        NextResponse.json({ error: 'rsvpId is required' }, { status: 400 })
      );
    }

    await markAttendance(data.rsvpId);

    const adminId = session.user.id || session.user.email;

    // Audit log
    await logAuditEvent(
      adminId,
      session.user.email,
      'content.updated',
      'RecruitmentRSVP',
      {
        targetId: data.rsvpId,
        meta: {
          action: 'check_in',
        },
      }
    );

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error marking attendance:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
    );
  }
}
