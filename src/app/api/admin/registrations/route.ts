import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI!;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get all events with their details
    const events = await db.collection('Event').find({}).toArray();
    const eventsMap = new Map(events.map(event => [event.id, event]));

    // Get all attendance records with full details
    const attendanceRecords = await db.collection('EventAttendance')
      .find({})
      .sort({ registeredAt: -1 }) // Most recent first
      .toArray();

    // Process the data to get comprehensive registration info
    const registrations = attendanceRecords.map(record => {
      const event = eventsMap.get(record.eventId);
      return {
        id: record._id,
        attendanceId: record.id,
        eventId: record.eventId,
        eventTitle: event?.title || 'Unknown Event',
        eventDate: event?.eventDate || null,
        eventType: event?.eventType || 'Unknown',
        attendee: {
          name: record.attendee?.name || 'No name',
          email: record.attendee?.umichEmail || record.email || 'No email',
          major: record.attendee?.major || 'Not specified',
          gradeLevel: record.attendee?.gradeLevel || 'Not specified',
          phone: record.attendee?.phone || 'Not provided'
        },
        status: record.status,
        waitlistPosition: record.waitlistPosition || null,
        registeredAt: record.registeredAt,
        confirmedAt: record.confirmedAt || null,
        source: record.source || 'website',
        checkInCode: record.checkInCode || null
      };
    });

    // Calculate summary statistics
    const totalRegistrations = registrations.length;
    const confirmedRegistrations = registrations.filter(r => r.status === 'confirmed').length;
    const waitlistedRegistrations = registrations.filter(r => r.status === 'waitlisted').length;
    const uniqueAttendees = new Set(registrations.map(r => r.attendee.email)).size;
    
    // Group by event type
    const registrationsByType: Record<string, number> = {};
    registrations.forEach(reg => {
      registrationsByType[reg.eventType] = (registrationsByType[reg.eventType] || 0) + 1;
    });

    // Group by major
    const registrationsByMajor: Record<string, number> = {};
    registrations.forEach(reg => {
      const major = reg.attendee.major === 'Not specified' ? 'Not specified' : reg.attendee.major;
      registrationsByMajor[major] = (registrationsByMajor[major] || 0) + 1;
    });

    // Group by grade level
    const registrationsByGrade: Record<string, number> = {};
    registrations.forEach(reg => {
      const grade = reg.attendee.gradeLevel === 'Not specified' ? 'Not specified' : reg.attendee.gradeLevel;
      registrationsByGrade[grade] = (registrationsByGrade[grade] || 0) + 1;
    });

    // Recent registrations (last 10)
    const recentRegistrations = registrations.slice(0, 10);

    await client.close();

    return NextResponse.json({
      summary: {
        totalRegistrations,
        confirmedRegistrations,
        waitlistedRegistrations,
        uniqueAttendees,
        registrationsByType,
        registrationsByMajor,
        registrationsByGrade
      },
      recentRegistrations,
      allRegistrations: registrations
    });

  } catch (error) {
    console.error('Registrations error:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}