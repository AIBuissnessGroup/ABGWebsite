import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get all events that have waitlist enabled
    const events = await db.collection('Event').find({
      $or: [
        { published: true },
        { published: 1 }
      ],
      waitlistEnabled: true
    }).toArray();

    let totalWaitlisted = 0;
    let eventsWithWaitlists = 0;
    let promotableEvents = 0;

    // Process each event to get waitlist details
    const eventsWithWaitlistDetails = await Promise.all(events.map(async (event) => {
      // Get all attendees for this event
      const attendees = await db.collection('EventAttendance').find({
        eventId: event.id
      }).toArray();

      const confirmed = attendees.filter(a => a.status === 'confirmed');
      const waitlisted = attendees.filter(a => a.status === 'waitlisted');
      
      // Count totals
      totalWaitlisted += waitlisted.length;
      if (waitlisted.length > 0) eventsWithWaitlists++;
      
      // Check if event can promote people (has capacity available)
      const canPromote = !event.capacity || confirmed.length < event.capacity;
      if (canPromote && waitlisted.length > 0) promotableEvents++;

      return {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        eventType: event.eventType,
        capacity: event.capacity,
        waitlistMaxSize: event.waitlistMaxSize,
        attendees: attendees.map(a => ({
          id: a.id,
          name: a.attendee?.name || a.name,
          email: a.attendee?.umichEmail || a.email,
          major: a.attendee?.major || a.major,
          gradeLevel: a.attendee?.gradeLevel || a.gradeLevel,
          status: a.status,
          waitlistPosition: a.waitlistPosition,
          registeredAt: a.registeredAt,
          confirmedAt: a.confirmedAt
        })),
        confirmedCount: confirmed.length,
        waitlistCount: waitlisted.length,
        canPromote: canPromote,
        waitlistSpots: waitlisted.sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0))
      };
    }));

    // Calculate waitlist analytics by event type
    const waitlistByType: Record<string, { events: number, waitlisted: number }> = {};
    eventsWithWaitlistDetails.forEach(event => {
      if (!waitlistByType[event.eventType]) {
        waitlistByType[event.eventType] = { events: 0, waitlisted: 0 };
      }
      if (event.waitlistCount > 0) {
        waitlistByType[event.eventType].events++;
        waitlistByType[event.eventType].waitlisted += event.waitlistCount;
      }
    });

    await client.close();

    return NextResponse.json({
      totalWaitlisted,
      eventsWithWaitlists,
      promotableEvents,
      waitlistByType,
      events: eventsWithWaitlistDetails
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist data' }, { status: 500 });
  }
}

// Promote someone from waitlist to confirmed
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, attendanceId } = await request.json();

    if (!eventId || !attendanceId) {
      return NextResponse.json({ error: 'Event ID and attendance ID required' }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get the event
    const event = await db.collection('Event').findOne({ 
      id: eventId, 
      $or: [{ published: true }, { published: 1 }]
    });
    
    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if there's capacity
    if (event.capacity) {
      const confirmedCount = await db.collection('EventAttendance').countDocuments({
        eventId: eventId,
        status: 'confirmed'
      });
      
      if (confirmedCount >= event.capacity) {
        await client.close();
        return NextResponse.json({ error: 'Event is at capacity' }, { status: 400 });
      }
    }

    // Find the person on waitlist
    const attendance = await db.collection('EventAttendance').findOne({
      id: attendanceId,
      eventId: eventId,
      status: 'waitlisted'
    });
    
    if (!attendance) {
      await client.close();
      return NextResponse.json({ error: 'Person not found on waitlist' }, { status: 404 });
    }

    // Promote to confirmed
    await db.collection('EventAttendance').updateOne(
      { id: attendanceId },
      {
        $set: {
          status: 'confirmed',
          confirmedAt: Date.now(),
          promotedFromWaitlist: true
        },
        $unset: {
          waitlistPosition: 1
        }
      }
    );

    // Update waitlist positions for remaining people
    const remainingWaitlist = await db.collection('EventAttendance').find({
      eventId: eventId,
      status: 'waitlisted'
    }).sort({ waitlistPosition: 1 }).toArray();

    // Reassign positions
    for (let i = 0; i < remainingWaitlist.length; i++) {
      await db.collection('EventAttendance').updateOne(
        { id: remainingWaitlist[i].id },
        { $set: { waitlistPosition: i + 1 } }
      );
    }

    await client.close();

    return NextResponse.json({ success: true, message: 'Person promoted from waitlist' });

  } catch (error) {
    console.error('Promote waitlist error:', error);
    return NextResponse.json({ error: 'Failed to promote from waitlist' }, { status: 500 });
  }
}