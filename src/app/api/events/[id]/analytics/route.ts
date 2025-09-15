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

    // Get event details
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    });

    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get all attendees for this event
    const attendees = await db.collection('EventAttendance').find({
      eventId: eventId
    }).toArray();

    // Basic statistics - EventAttendance records represent confirmed attendees
    const stats = {
      totalRegistrations: attendees.length,
      confirmedAttendees: attendees.length, // All records in EventAttendance are confirmed
      waitlistedAttendees: 0, // No waitlist status tracking currently
      actualAttendance: attendees.length, // Assume all confirmed attendees attended for now
      cancelledRegistrations: 0 // No cancelled status tracking currently
    };

    // Demographics breakdown - not available in current EventAttendance structure
    const gradeBreakdown: Record<string, number> = {};
    const majorBreakdown: Record<string, number> = {};

    // Note: Demographics not available in current EventAttendance schema
    // Would need to join with User collection or store demographics in EventAttendance

    // Registration timeline (daily registrations)
    const registrationTimeline: Array<{ date: string; count: number }> = [];
    const registrationsByDate: Record<string, number> = {};

    attendees.forEach((attendee: any) => {
      const date = new Date(attendee.confirmedAt).toISOString().split('T')[0];
      registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
    });

    Object.entries(registrationsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        registrationTimeline.push({ date, count });
      });

    // Hourly registration pattern
    const hourlyPattern: Record<number, number> = {};
    attendees.forEach((attendee: any) => {
      const hour = new Date(attendee.confirmedAt).getHours();
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
    });

    // Detailed attendee list for management
    const attendeeList = attendees.map((attendee: any) => ({
      id: attendee.id,
      name: attendee.name,
      email: attendee.email,
      major: null, // Not available in current schema
      gradeLevel: null, // Not available in current schema
      phone: null, // Not available in current schema
      status: 'confirmed', // All records in EventAttendance are confirmed
      registeredAt: attendee.confirmedAt,
      confirmedAt: attendee.confirmedAt,
      attendedAt: null, // Not tracked in current schema
      waitlistPosition: null, // Not tracked in current schema
      source: attendee.source,
      checkInCode: null // Not available in current schema
    }));

    // Calculate rates
    const cancellationRate = stats.totalRegistrations > 0 ? 
      (stats.cancelledRegistrations / stats.totalRegistrations * 100) : 0;
    
    const attendanceRate = stats.confirmedAttendees > 0 ? 
      (stats.actualAttendance / stats.confirmedAttendees * 100) : 0;

    await client.close();

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        capacity: event.capacity,
        location: event.location,
        venue: event.venue
      },
      statistics: {
        ...stats,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      demographics: {
        byGrade: gradeBreakdown,
        byMajor: majorBreakdown
      },
      timeline: {
        registrations: registrationTimeline,
        hourlyPattern: Object.entries(hourlyPattern)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => a.hour - b.hour)
      },
      attendees: attendeeList
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { action, attendeeIds, newStatus } = body;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    switch (action) {
      case 'bulkUpdateStatus':
        if (!attendeeIds || !newStatus) {
          await client.close();
          return NextResponse.json({ error: 'Missing attendeeIds or newStatus' }, { status: 400 });
        }

        await db.collection('EventAttendance').updateMany(
          { 
            id: { $in: attendeeIds },
            eventId: eventId
          },
          { 
            $set: { 
              status: newStatus,
              ...(newStatus === 'attended' ? { attendedAt: Date.now() } : {})
            }
          }
        );
        break;

      case 'markAttended':
        if (!attendeeIds) {
          await client.close();
          return NextResponse.json({ error: 'Missing attendeeIds' }, { status: 400 });
        }

        await db.collection('EventAttendance').updateMany(
          { 
            id: { $in: attendeeIds },
            eventId: eventId
          },
          { 
            $set: { 
              status: 'attended',
              attendedAt: Date.now()
            }
          }
        );
        break;

      case 'exportAttendees':
        // Return CSV data for download
        const attendees = await db.collection('EventAttendance').find({
          eventId: eventId
        }).toArray();

        const csvData = generateCSV(attendees);
        await client.close();
        
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="event-${eventId}-attendees.csv"`
          }
        });

      default:
        await client.close();
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await client.close();
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics management error:', error);
    return NextResponse.json({ error: 'Management action failed' }, { status: 500 });
  }
}

function generateCSV(attendees: any[]): string {
  const headers = [
    'Name', 'Email', 'Major', 'Grade Level', 'Phone', 'Status', 
    'Registered At', 'Confirmed At', 'Attended At', 'Waitlist Position', 'Check-in Code'
  ];
  
  const rows = attendees.map((attendee: any) => [
    attendee.attendee.name || '',
    attendee.attendee.umichEmail || '',
    attendee.attendee.major || '',
    attendee.attendee.gradeLevel || '',
    attendee.attendee.phone || '',
    attendee.status || '',
    attendee.registeredAt ? new Date(attendee.registeredAt).toISOString() : '',
    attendee.confirmedAt ? new Date(attendee.confirmedAt).toISOString() : '',
    attendee.attendedAt ? new Date(attendee.attendedAt).toISOString() : '',
    attendee.waitlistPosition || '',
    attendee.checkInCode || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
}