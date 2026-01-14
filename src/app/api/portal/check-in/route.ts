/**
 * Portal Check-In API
 * POST - Check in to an event with code and optional photo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getActiveCycle,
  getEventById,
  checkInToEvent,
  getRsvpByUserAndEvent,
  createRsvp,
} from '@/lib/recruitment/db';

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
    const { eventId, photo } = data;

    if (!eventId) {
      return corsResponse(
        NextResponse.json({ error: 'eventId is required' }, { status: 400 })
      );
    }

    if (!photo) {
      return corsResponse(
        NextResponse.json({ error: 'Photo is required for check-in' }, { status: 400 })
      );
    }

    // Verify event exists and belongs to this cycle
    const event = await getEventById(eventId);
    if (!event) {
      return corsResponse(
        NextResponse.json({ error: 'Event not found' }, { status: 404 })
      );
    }

    if (event.cycleId !== cycle._id) {
      return corsResponse(
        NextResponse.json({ error: 'Event not in current cycle' }, { status: 400 })
      );
    }

    const userId = session.user.id || session.user.email;

    // Check if user has RSVP'd - auto-RSVP if not (even past deadline)
    let rsvp = await getRsvpByUserAndEvent(eventId, userId);
    if (!rsvp) {
      // Auto-RSVP the user
      await createRsvp({
        cycleId: cycle._id!,
        eventId,
        userId,
        applicantName: session.user.name || undefined,
        applicantEmail: session.user.email,
        eventTitle: event.title,
        rsvpAt: new Date().toISOString(),
      });
      // Re-fetch the RSVP
      rsvp = await getRsvpByUserAndEvent(eventId, userId);
    }

    // Already checked in?
    if (rsvp?.checkedInAt) {
      return corsResponse(
        NextResponse.json({ 
          error: 'You have already checked in to this event',
          checkedInAt: rsvp.checkedInAt,
        }, { status: 400 })
      );
    }

    // Attempt check-in (photo only, no code required)
    const result = await checkInToEvent(eventId, userId, photo);

    if (!result.success) {
      return corsResponse(
        NextResponse.json({ error: result.error }, { status: 400 })
      );
    }

    return corsResponse(NextResponse.json({ 
      success: true,
      message: 'Successfully checked in!',
    }));
  } catch (error) {
    console.error('Error checking in:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
    );
  }
}

// GET - Check if user has checked in to an event
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return corsResponse(
        NextResponse.json({ error: 'eventId is required' }, { status: 400 })
      );
    }

    const userId = session.user.id || session.user.email;
    const rsvp = await getRsvpByUserAndEvent(eventId, userId);

    return corsResponse(NextResponse.json({
      hasRsvp: !!rsvp,
      checkedIn: !!rsvp?.checkedInAt,
      checkedInAt: rsvp?.checkedInAt,
    }));
  } catch (error) {
    console.error('Error checking status:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    );
  }
}
