import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { action, attendanceIds } = body; // action: 'promote' | 'expand' | 'remove'

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get event details
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    });

    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.waitlist?.enabled) {
      await client.close();
      return NextResponse.json({ error: 'Waitlist is not enabled for this event' }, { status: 400 });
    }

    switch (action) {
      case 'promote':
        await promoteFromWaitlist(db, eventId, event, attendanceIds);
        break;
      
      case 'expand':
        await expandCapacity(db, eventId, body.newCapacity);
        break;
      
      case 'remove':
        await removeFromWaitlist(db, eventId, attendanceIds);
        break;
      
      default:
        await client.close();
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await client.close();
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Waitlist management error:', error);
    return NextResponse.json({ error: 'Waitlist management failed' }, { status: 500 });
  }
}

async function promoteFromWaitlist(db: any, eventId: string, event: any, attendanceIds?: string[]) {
  // Get current confirmed count
  const confirmedCount = await db.collection('EventAttendance').countDocuments({
    eventId: eventId,
    status: 'confirmed'
  });

  if (!event.capacity || confirmedCount >= event.capacity) {
    throw new Error('Cannot promote: event is at capacity');
  }

  const availableSpots = event.capacity - confirmedCount;

  // Get waitlisted attendees to promote
  const query: any = {
    eventId: eventId,
    status: 'waitlisted'
  };

  if (attendanceIds && attendanceIds.length > 0) {
    query.id = { $in: attendanceIds };
  }

  const waitlistedAttendees = await db.collection('EventAttendance')
    .find(query)
    .sort({ waitlistPosition: 1 }) // Promote in order
    .limit(availableSpots)
    .toArray();

  if (waitlistedAttendees.length === 0) {
    throw new Error('No waitlisted attendees to promote');
  }

  // Promote attendees
  const promotedIds = waitlistedAttendees.map((a: any) => a.id);
  
  await db.collection('EventAttendance').updateMany(
    { id: { $in: promotedIds } },
    {
      $set: {
        status: 'confirmed',
        confirmedAt: Date.now()
      },
      $unset: {
        waitlistPosition: ""
      }
    }
  );

  // Reorder remaining waitlist positions
  await reorderWaitlist(db, eventId);

  // TODO: Send promotion notification emails/SMS
  console.log(`Promoted ${promotedIds.length} attendees from waitlist for event ${eventId}`);
}

async function expandCapacity(db: any, eventId: string, newCapacity: number) {
  // Update event capacity
  await db.collection('Event').updateOne(
    { id: eventId },
    { 
      $set: { 
        capacity: newCapacity,
        updatedAt: Date.now()
      } 
    }
  );

  // Auto-promote if enabled
  const event = await db.collection('Event').findOne({ id: eventId });
  if (event.waitlist?.autoPromote) {
    await promoteFromWaitlist(db, eventId, { ...event, capacity: newCapacity });
  }
}

async function removeFromWaitlist(db: any, eventId: string, attendanceIds: string[]) {
  if (!attendanceIds || attendanceIds.length === 0) {
    throw new Error('No attendance IDs provided');
  }

  // Remove from waitlist
  await db.collection('EventAttendance').updateMany(
    { 
      id: { $in: attendanceIds },
      eventId: eventId,
      status: 'waitlisted'
    },
    {
      $set: {
        status: 'cancelled'
      },
      $unset: {
        waitlistPosition: ""
      }
    }
  );

  // Reorder remaining waitlist
  await reorderWaitlist(db, eventId);
}

async function reorderWaitlist(db: any, eventId: string) {
  // Get all waitlisted attendees ordered by registration time
  const waitlistedAttendees = await db.collection('EventAttendance')
    .find({
      eventId: eventId,
      status: 'waitlisted'
    })
    .sort({ registeredAt: 1 })
    .toArray();

  // Update positions
  const updates = waitlistedAttendees.map((attendee: any, index: number) => ({
    updateOne: {
      filter: { id: attendee.id },
      update: { $set: { waitlistPosition: index + 1 } }
    }
  }));

  if (updates.length > 0) {
    await db.collection('EventAttendance').bulkWrite(updates);
  }
}

// Auto-promotion function that can be called when someone cancels
export async function autoPromoteFromWaitlist(eventId: string) {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    });

    if (!event || !event.waitlist?.enabled || !event.waitlist?.autoPromote) {
      await client.close();
      return;
    }

    await promoteFromWaitlist(db, eventId, event);
    await client.close();

  } catch (error) {
    console.error('Auto-promotion error:', error);
  }
}