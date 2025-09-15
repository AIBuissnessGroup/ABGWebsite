import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get event to ensure it exists
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    });

    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get attendance statistics
    const [
      confirmedAttendees,
      waitlistSize,
      totalRegistrations,
      actualAttendance
    ] = await Promise.all([
      db.collection('EventAttendance').countDocuments({
        eventId: eventId,
        status: 'confirmed'
      }),
      db.collection('EventAttendance').countDocuments({
        eventId: eventId,
        status: 'waitlisted'
      }),
      db.collection('EventAttendance').countDocuments({
        eventId: eventId,
        status: { $in: ['confirmed', 'waitlisted'] }
      }),
      db.collection('EventAttendance').countDocuments({
        eventId: eventId,
        status: 'attended'
      })
    ]);

    // Get demographic breakdowns
    const attendees = await db.collection('EventAttendance').find({
      eventId: eventId,
      status: { $in: ['confirmed', 'waitlisted', 'attended'] }
    }).toArray();

    const gradeBreakdown: Record<string, number> = {};
    const majorBreakdown: Record<string, number> = {};

    attendees.forEach((attendee: any) => {
      if (attendee.attendee.gradeLevel) {
        gradeBreakdown[attendee.attendee.gradeLevel] = (gradeBreakdown[attendee.attendee.gradeLevel] || 0) + 1;
      }
      if (attendee.attendee.major) {
        majorBreakdown[attendee.attendee.major] = (majorBreakdown[attendee.attendee.major] || 0) + 1;
      }
    });

    // Get registration timeline (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const registrationTimeline = await db.collection('EventAttendance').aggregate([
      {
        $match: {
          eventId: eventId,
          registeredAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$registeredAt" }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    await client.close();

    const stats = {
      confirmedAttendees,
      waitlistSize,
      totalRegistrations,
      actualAttendance,
      cancellationRate: totalRegistrations > 0 ? 
        ((totalRegistrations - confirmedAttendees - waitlistSize) / totalRegistrations * 100) : 0,
      attendanceRate: confirmedAttendees > 0 ? 
        (actualAttendance / confirmedAttendees * 100) : 0,
      demographicBreakdown: {
        byGrade: gradeBreakdown,
        byMajor: majorBreakdown
      },
      registrationTimeline: registrationTimeline.map((item: any) => ({
        date: new Date(item._id).getTime(),
        count: item.count
      }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Event stats error:', error);
    return NextResponse.json({ error: 'Failed to get event statistics' }, { status: 500 });
  }
}