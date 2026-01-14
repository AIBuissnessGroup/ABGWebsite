/**
 * Portal RSVP API
 * POST - Create an RSVP
 * DELETE - Cancel an RSVP
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getActiveCycle,
  getEventById,
  getRsvpsByUser,
  getRsvpsByEvent,
  createRsvp,
  deleteRsvp,
} from '@/lib/recruitment/db';
import type { EventRsvp } from '@/types/recruitment';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const cycle = await getActiveCycle();
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'No active recruitment cycle' }, { status: 404 })
      );
    }

    const data = await request.json();

    if (!data.eventId) {
      return corsResponse(
        NextResponse.json({ error: 'eventId is required' }, { status: 400 })
      );
    }

    // Verify event exists and belongs to this cycle
    const event = await getEventById(data.eventId);
    if (!event) {
      return corsResponse(
        NextResponse.json({ error: 'Event not found' }, { status: 404 })
      );
    }

    const cycleId = cycle._id!;

    if (event.cycleId !== cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'Event not in current cycle' }, { status: 400 })
      );
    }

    // Check if RSVP is enabled
    if (event.rsvpEnabled === false) {
      return corsResponse(
        NextResponse.json({ error: 'RSVP is not enabled for this event' }, { status: 400 })
      );
    }

    // Check RSVP deadline
    if (event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline)) {
      return corsResponse(
        NextResponse.json({ error: 'RSVP deadline has passed' }, { status: 400 })
      );
    }

    // Check capacity
    if (event.capacity) {
      const existingRsvps = await getRsvpsByEvent(data.eventId);
      if (existingRsvps.length >= event.capacity) {
        return corsResponse(
          NextResponse.json({ error: 'Event is at capacity' }, { status: 400 })
        );
      }
    }

    const userId = session.user.id || session.user.email;

    // Check if user already has an RSVP for this event
    const userRsvps = await getRsvpsByUser(cycleId, userId);
    const existingRsvp = userRsvps.find(r => r.eventId === data.eventId);
    
    if (existingRsvp) {
      return corsResponse(
        NextResponse.json({ error: 'Already RSVP\'d to this event', rsvp: existingRsvp }, { status: 400 })
      );
    }

    // Create new RSVP
    const rsvpData: Omit<EventRsvp, '_id' | 'createdAt'> = {
      cycleId,
      eventId: data.eventId,
      userId,
      applicantName: session.user.name || session.user.email,
      applicantEmail: session.user.email,
      eventTitle: event.title,
      rsvpAt: new Date().toISOString(),
    };

    const rsvpId = await createRsvp(rsvpData);

    return corsResponse(NextResponse.json({ 
      rsvpId,
      message: 'RSVP confirmed!',
    }, { status: 201 }));
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const cycle = await getActiveCycle();
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'No active recruitment cycle' }, { status: 404 })
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return corsResponse(
        NextResponse.json({ error: 'eventId is required' }, { status: 400 })
      );
    }

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;

    // Delete the RSVP
    await deleteRsvp(cycleId, eventId, userId);

    return corsResponse(NextResponse.json({ 
      success: true,
      message: 'RSVP cancelled',
    }));
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to cancel RSVP' }, { status: 500 })
    );
  }
}
