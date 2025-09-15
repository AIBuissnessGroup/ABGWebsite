import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  return adminEmails.includes(email);
}

// Check in an attendee (mark as attended)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { attendeeId } = await request.json();

    if (!attendeeId) {
      return NextResponse.json({ error: 'Attendee ID required' }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Verify event exists
    const event = await db.collection('Event').findOne({ id: eventId });
    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find and update attendee
    const result = await db.collection('EventAttendance').updateOne(
      { 
        id: attendeeId,
        eventId: eventId
      },
      {
        $set: {
          status: 'attended',
          attendedAt: Date.now()
        }
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Attendee already checked in' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Attendee checked in successfully',
      checkedInAt: Date.now()
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Undo check-in (revert to confirmed status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { attendeeId } = await request.json();

    if (!attendeeId) {
      return NextResponse.json({ error: 'Attendee ID required' }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Verify event exists
    const event = await db.collection('Event').findOne({ id: eventId });
    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find and update attendee
    const result = await db.collection('EventAttendance').updateOne(
      { 
        id: attendeeId,
        eventId: eventId,
        status: 'attended'
      },
      {
        $set: {
          status: 'confirmed'
        },
        $unset: {
          attendedAt: ""
        }
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Attendee not found or not checked in' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Check-in reversed successfully'
    });

  } catch (error) {
    console.error('Undo check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}