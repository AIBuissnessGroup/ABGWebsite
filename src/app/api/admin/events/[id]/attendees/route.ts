import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { attendanceId } = await request.json();

    if (!attendanceId) {
      return NextResponse.json({ error: 'Attendance ID required' }, { status: 400 });
    }

    const client = createMongoClient();
    await client.connect();
    const db = client.db();

    // Get the attendance record to remove
    const attendanceRecord = await db.collection('EventAttendance').findOne({
      _id: new ObjectId(attendanceId),
      eventId: eventId
    });

    if (!attendanceRecord) {
      await client.close();
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // If this person was waitlisted, we need to update positions
    if (attendanceRecord.status === 'waitlisted') {
      // Move all people below this position up by 1
      await db.collection('EventAttendance').updateMany(
        {
          eventId: eventId,
          status: 'waitlisted',
          waitlistPosition: { $gt: attendanceRecord.waitlistPosition }
        },
        {
          $inc: { waitlistPosition: -1 }
        }
      );
    }

    // Remove the attendance record
    await db.collection('EventAttendance').deleteOne({
      _id: new ObjectId(attendanceId)
    });

    let promotionMessage = '';

    // If a confirmed attendee was removed, try to promote someone from waitlist
    if (attendanceRecord.status === 'confirmed') {
      // Get event details to check capacity
      const event = await db.collection('Event').findOne({ id: eventId });
      
      if (event && event.capacity) {
        // Get current confirmed count
        const confirmedCount = await db.collection('EventAttendance').countDocuments({
          eventId: eventId,
          status: 'confirmed'
        });

        // If we're now under capacity, promote the next person from waitlist
        if (confirmedCount < event.capacity) {
          const nextWaitlisted = await db.collection('EventAttendance').findOne({
            eventId: eventId,
            status: 'waitlisted'
          }, {
            sort: { waitlistPosition: 1 } // Get person with lowest (first) position
          });

          if (nextWaitlisted) {
            // Promote this person
            await db.collection('EventAttendance').updateOne(
              { _id: nextWaitlisted._id },
              {
                $set: {
                  status: 'confirmed',
                  confirmedAt: Date.now()
                },
                $unset: {
                  waitlistPosition: ''
                }
              }
            );

            // Update waitlist positions for everyone behind this person
            await db.collection('EventAttendance').updateMany(
              {
                eventId: eventId,
                status: 'waitlisted',
                waitlistPosition: { $gt: nextWaitlisted.waitlistPosition }
              },
              {
                $inc: { waitlistPosition: -1 }
              }
            );

            promotionMessage = ` and automatically promoted ${nextWaitlisted.attendee?.name || nextWaitlisted.attendee?.umichEmail} from waitlist`;
          }
        }
      }
    }

    await client.close();

    return NextResponse.json({ 
      success: true,
      message: `Removed ${attendanceRecord.attendee?.name || attendanceRecord.attendee?.umichEmail} from the event${promotionMessage}`
    });

  } catch (error) {
    console.error('Remove attendee error:', error);
    return NextResponse.json({ error: 'Failed to remove attendee' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { action, attendanceId } = await request.json();

    if (!action || !attendanceId) {
      return NextResponse.json({ error: 'Action and attendance ID required' }, { status: 400 });
    }

    const client = createMongoClient();
    await client.connect();
    const db = client.db();

    if (action === 'promote') {
      // Get the waitlisted person to promote
      const waitlistedPerson = await db.collection('EventAttendance').findOne({
        _id: new ObjectId(attendanceId),
        eventId: eventId,
        status: 'waitlisted'
      });

      if (!waitlistedPerson) {
        await client.close();
        return NextResponse.json({ error: 'Waitlisted person not found' }, { status: 404 });
      }

      // Check if there's space (get event capacity and current confirmed count)
      const event = await db.collection('Event').findOne({ id: eventId });
      if (!event) {
        await client.close();
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const confirmedCount = await db.collection('EventAttendance').countDocuments({
        eventId: eventId,
        status: 'confirmed'
      });

      if (event.capacity && confirmedCount >= event.capacity) {
        await client.close();
        return NextResponse.json({ error: 'Event is at capacity' }, { status: 400 });
      }

      // Promote the person
      await db.collection('EventAttendance').updateOne(
        { _id: new ObjectId(attendanceId) },
        {
          $set: {
            status: 'confirmed',
            confirmedAt: Date.now()
          },
          $unset: {
            waitlistPosition: ''
          }
        }
      );

      // Update waitlist positions for everyone behind this person
      await db.collection('EventAttendance').updateMany(
        {
          eventId: eventId,
          status: 'waitlisted',
          waitlistPosition: { $gt: waitlistedPerson.waitlistPosition }
        },
        {
          $inc: { waitlistPosition: -1 }
        }
      );

      await client.close();

      return NextResponse.json({ 
        success: true,
        message: `Promoted ${waitlistedPerson.attendee?.name || waitlistedPerson.attendee?.umichEmail} from waitlist`
      });

    } else {
      await client.close();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Manage attendee error:', error);
    return NextResponse.json({ error: 'Failed to manage attendee' }, { status: 500 });
  }
}