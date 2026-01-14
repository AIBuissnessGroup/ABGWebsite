/**
 * Recruitment Event by ID API
 * GET - Get a specific event
 * PUT - Update an event
 * DELETE - Delete an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getEventById, updateEvent, deleteEvent, withConnection, COLLECTIONS } from '@/lib/recruitment/db';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const event = await getEventById(id);
    
    if (!event) {
      return corsResponse(NextResponse.json({ error: 'Event not found' }, { status: 404 }));
    }

    return corsResponse(NextResponse.json(event));
  } catch (error) {
    console.error('Error fetching recruitment event:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    // Check if event exists first
    const existingEvent = await getEventById(id);
    if (!existingEvent) {
      return corsResponse(NextResponse.json({ error: 'Event not found' }, { status: 404 }));
    }

    const data = await request.json();

    // Handle date conversions
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.venue !== undefined) updateData.venue = data.venue;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.rsvpEnabled !== undefined) updateData.rsvpEnabled = data.rsvpEnabled;
    if (data.rsvpDeadline !== undefined) updateData.rsvpDeadline = new Date(data.rsvpDeadline);
    if (data.checkInEnabled !== undefined) updateData.checkInEnabled = data.checkInEnabled;
    if (data.calendarId !== undefined) updateData.calendarId = data.calendarId;

    await updateEvent(id, updateData);
    
    // Fetch updated event
    const updatedEvent = await getEventById(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.updated',
      'RecruitmentEvent',
      {
        targetId: id,
        meta: {
          eventTitle: existingEvent.title,
          updatedFields: Object.keys(updateData),
        },
      }
    );

    return corsResponse(NextResponse.json(updatedEvent));
  } catch (error) {
    console.error('Error updating recruitment event:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    // Check if event exists
    const event = await getEventById(id);
    if (!event) {
      return corsResponse(NextResponse.json({ error: 'Event not found' }, { status: 404 }));
    }

    // Delete associated RSVPs first
    await withConnection(async (db) => {
      await db.collection(COLLECTIONS.RSVPS).deleteMany({ eventId: id });
    });

    // Delete the event
    await deleteEvent(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.deleted',
      'RecruitmentEvent',
      {
        targetId: id,
        meta: {
          eventTitle: event.title,
        },
      }
    );

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting recruitment event:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    );
  }
}
