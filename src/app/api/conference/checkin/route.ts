import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket } from '@/types/conference-ticket';
import { sanitizeStringInput } from '@/lib/conference-security';
import { CHECKIN_STAFF_ACCESS_ENDS, getCheckinAccess, setTicketCheckIn } from '@/lib/conference-checkin';

export const dynamic = 'force-dynamic';

// Roster for the check-in page (admins and assigned check-in staff only). Returns only what check-in needs.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const access = await getCheckinAccess(session);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: session ? 403 : 401 });
    }

    const db = await getDb();
    const tickets = await db
      .collection<ConferenceTicket>('ConferenceTickets')
      .find({}, {
        projection: {
          _id: 0,
          id: 1,
          ticketCode: 1,
          attendeeName: 1,
          attendeeEmail: 1,
          tier: 1,
          status: 1,
          checkedIn: 1,
          checkedInAt: 1,
          checkedInBy: 1,
          checkInToken: 1,
          dietaryRestrictions: 1,
        },
      })
      .sort({ attendeeName: 1 })
      .toArray();

    return NextResponse.json({
      tickets,
      role: access.role,
      email: access.email,
      accessEndsAt: access.role === 'staff' ? CHECKIN_STAFF_ACCESS_ENDS : null,
    });
  } catch (error) {
    console.error('Error loading check-in roster:', error);
    return NextResponse.json({ error: 'Failed to load roster' }, { status: 500 });
  }
}

// Check an attendee in (or undo)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const access = await getCheckinAccess(session);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: session ? 403 : 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body.ticketId || typeof body.ticketId !== 'string' || typeof body.checkedIn !== 'boolean') {
      return NextResponse.json({ error: 'Valid ticketId and checkedIn status required' }, { status: 400 });
    }

    const result = await setTicketCheckIn(sanitizeStringInput(body.ticketId, 50), body.checkedIn, access.email);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Error updating check-in:', error);
    return NextResponse.json({ error: 'Failed to update check-in' }, { status: 500 });
  }
}
