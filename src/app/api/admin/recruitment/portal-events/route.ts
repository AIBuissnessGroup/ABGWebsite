/**
 * Recruitment Events API
 * GET - List events for a cycle
 * POST - Create a new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getEventsByCycle, createEvent, getCycleById, getEventById } from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { RecruitmentEvent } from '@/types/recruitment';

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
    const cycleId = searchParams.get('cycleId');

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    const events = await getEventsByCycle(cycleId);
    return corsResponse(NextResponse.json(events));
  } catch (error) {
    console.error('Error fetching recruitment events:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
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
    if (!data.cycleId || !data.title || !data.startAt || !data.endAt || !data.location) {
      return corsResponse(
        NextResponse.json(
          { error: 'cycleId, title, startAt, endAt, and location are required' },
          { status: 400 }
        )
      );
    }

    // Verify cycle exists
    const cycle = await getCycleById(data.cycleId);
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
      );
    }

    const eventData: Omit<RecruitmentEvent, '_id' | 'createdAt' | 'updatedAt'> = {
      cycleId: data.cycleId,
      title: data.title,
      description: data.description || '',
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      location: data.location,
      venue: data.venue || undefined,
      capacity: data.capacity || undefined,
      rsvpEnabled: data.rsvpEnabled ?? true,
      rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : undefined,
      checkInEnabled: data.checkInEnabled ?? false,
      calendarId: data.calendarId || undefined,
      createdByAdminId: session.user.id || session.user.email,
    };

    const eventId = await createEvent(eventData);
    const event = await getEventById(eventId);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.created',
      'RecruitmentEvent',
      {
        targetId: eventId,
        meta: {
          eventTitle: event?.title,
          cycleId: data.cycleId,
        },
      }
    );

    return corsResponse(NextResponse.json(event, { status: 201 }));
  } catch (error) {
    console.error('Error creating recruitment event:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    );
  }
}
