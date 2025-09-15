import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

// Create a new client for each request to avoid connection issues
function createMongoClient() {
  return new MongoClient(uri);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createMongoClient();
  try {
    const { id } = await params; // Await params before accessing properties
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const countOnly = searchParams.get('countOnly') === '1';

    await client.connect();
    const db = client.db();

    console.log('🔍 Attendance API - Event ID:', id);

    // Verify event exists
    const event = await db.collection('Event').findOne({ id: id });
    if (!event) {
      console.log('❌ Event not found with ID:', id);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    console.log('✅ Event found:', event.title);

    if (countOnly) {
      const count = await db.collection('EventAttendance').countDocuments({ eventId: id });
      return NextResponse.json({ count });
    }

    const attendees = await db.collection('EventAttendance')
      .find({ eventId: id })
      .sort({ confirmedAt: -1, waitlistPosition: 1 })
      .toArray();

    console.log('📊 Found attendees:', attendees.length);

    const total = attendees.length;
    
    // Separate confirmed, waitlisted, and attended attendees
    // Note: 'attended' attendees should still be shown as confirmed since they were confirmed and then attended
    const confirmed = attendees.filter(a => a.status === 'confirmed' || a.status === 'attended');
    const waitlisted = attendees.filter(a => a.status === 'waitlisted');
    
    console.log('✅ Confirmed:', confirmed.length, 'Waitlisted:', waitlisted.length);
    
    const attendeesData = attendees.map(a => {
      // Handle both data structures: flat (a.email, a.name) and nested (a.attendee.umichEmail, a.attendee.name)
      const email = a.email || a.attendee?.umichEmail || 'Unknown';
      const name = a.name || a.attendee?.name;
      
      // If no name provided but we have a umich email, try to generate a name from the email prefix
      let userName = name;
      if ((!userName || userName === null) && email !== 'Unknown' && email.includes('@umich.edu')) {
        const emailPrefix = email.split('@')[0];
        // Convert email prefix to a more readable name format
        // e.g. "johnsmith" -> "John Smith", "j.smith" -> "J Smith", "jsmith123" -> "Jsmith123"
        userName = emailPrefix
          .split(/[._-]/)
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      }
      
      // Final fallback to email prefix
      if (!userName && email !== 'Unknown') {
        userName = email.split('@')[0];
      }
      
      // Last resort fallback
      if (!userName) {
        userName = 'Unknown';
      }
      
      return {
        email: email,
        userName: userName,
        confirmedAt: a.confirmedAt || a.registeredAt
      };
    });

    // Get unique users
    const uniqueEmails = new Set(attendeesData.map(a => a.email));
    const uniqueUsers = uniqueEmails.size;

    if (format === 'csv') {
      const csvContent = [
        'Email,Name,Confirmed At',
        ...attendeesData.map(a => `"${a.email}","${a.userName}","${new Date(a.confirmedAt).toLocaleString()}"`)
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="event-${id}-attendance.csv"`
        }
      });
    }

    return NextResponse.json({ 
      attendees: attendeesData, 
      confirmed,
      waitlisted,
      total,
      uniqueUsers
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}
