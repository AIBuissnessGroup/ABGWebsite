import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';




export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    
    
    const db = await getDb();

    // Get event details
    const event = await db.collection('Event').findOne({ id: eventId });

    

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: event.id,
      title: event.title,
      slug: event.slug,
      eventDate: event.eventDate,
      location: event.location,
      capacity: event.capacity,
      attendanceConfirmEnabled: event.attendanceConfirmEnabled
    });

  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
