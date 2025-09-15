import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI!;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get all events
    const events = await db.collection('Event').find({ published: true }).toArray();
    
    // Get all attendance records
    const attendanceRecords = await db.collection('EventAttendance').find({}).toArray();

    // Calculate analytics
    const totalEvents = events.length;
    
    // Calculate total attendees by counting all attendance records (they are all confirmed by being in the collection)
    const totalAttendees = attendanceRecords.length;
    
    // Calculate actual attendance - need to check if there's an 'attended' field or similar
    // For now, assume all confirmed attendees attended (since we don't track actual attendance separately)
    const totalActualAttendance = attendanceRecords.length;
    
    const averageAttendance = totalAttendees > 0 ? Math.round((totalActualAttendance / totalAttendees) * 100) : 0;

    // Upcoming events
    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.eventDate) > now).length;

    // Event breakdown by type
    const eventBreakdown: Record<string, number> = {};
    events.forEach(event => {
      eventBreakdown[event.eventType] = (eventBreakdown[event.eventType] || 0) + 1;
    });

    // Monthly attendance trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      // Get attendees for events in this month from EventAttendance collection
      const monthEventIds = monthEvents.map(event => event.id);
      const monthAttendees = attendanceRecords.filter(record => 
        monthEventIds.includes(record.eventId)
      ).length;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        events: monthEvents.length,
        attendees: monthAttendees
      });
    }

    // Popular event types by attendance
    const popularTypes: Record<string, { events: number, totalAttendees: number }> = {};
    events.forEach(event => {
      if (!popularTypes[event.eventType]) {
        popularTypes[event.eventType] = { events: 0, totalAttendees: 0 };
      }
      popularTypes[event.eventType].events++;
      
      // Count attendees for this event from EventAttendance collection
      const eventAttendees = attendanceRecords.filter(record => 
        record.eventId === event.id
      ).length;
      popularTypes[event.eventType].totalAttendees += eventAttendees;
    });

    await client.close();

    return NextResponse.json({
      totalEvents,
      totalAttendees,
      totalActualAttendance,
      averageAttendance,
      upcomingEvents,
      eventBreakdown,
      monthlyTrends,
      popularTypes
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}