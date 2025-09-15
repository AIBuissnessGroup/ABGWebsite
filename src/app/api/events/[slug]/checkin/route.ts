import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

// Self check-in endpoint for QR code scanning
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: eventSlug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session.user.email.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'UMich authentication required' }, { status: 401 });
    }

    const { checkInCode, attendeeId } = await request.json();

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Find event by slug to get the actual event ID
    const event = await db.collection('Event').findOne({ slug: eventSlug });
    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find the attendee record
    let query: any = { eventId: event.id };
    
    if (checkInCode && attendeeId) {
      // Specific attendee QR code
      query.checkInCode = checkInCode;
      query.id = attendeeId;
    } else {
      // General event QR code - find attendee by email
      // Try both possible email field patterns
      query = {
        eventId: event.id,
        $or: [
          { 'attendee.umichEmail': session.user.email },
          { email: session.user.email }
        ]
      };
    }

    console.log('Check-in query:', JSON.stringify(query));
    
    // First, let's see how many records match our query
    const matchingRecords = await db.collection('EventAttendance').find(query).toArray();
    console.log('Total matching records:', matchingRecords.length);
    if (matchingRecords.length > 1) {
      console.log('WARNING: Multiple records found:', matchingRecords.map(r => ({ id: r.id, email: r.attendee?.umichEmail || r.email, status: r.status })));
    }
    
    const attendee = await db.collection('EventAttendance').findOne(query);
    console.log('Found attendee:', attendee ? 'Yes' : 'No', attendee ? attendee.status : 'N/A');
    if (attendee) {
      console.log('Attendee details:', {
        _id: attendee._id,
        id: attendee.id,
        eventId: attendee.eventId,
        email: attendee.attendee?.umichEmail || attendee.email,
        status: attendee.status
      });
    }

    if (!attendee) {
      await client.close();
      return NextResponse.json({ 
        error: 'No registration found for this event. Please register first.',
        registered: false
      }, { status: 404 });
    }

    // For specific attendee QR codes, check if the authenticated user matches
    if (checkInCode && attendeeId) {
      const attendeeEmail = attendee.attendee?.umichEmail || attendee.email;
      if (attendeeEmail !== session.user.email) {
        await client.close();
        return NextResponse.json({ 
          error: 'This check-in code belongs to a different user. Please sign in with the correct account.',
          emailMismatch: true
        }, { status: 403 });
      }
    }

    // Check if user is confirmed (not waitlisted)
    if (attendee.status === 'waitlisted') {
      await client.close();
      return NextResponse.json({ 
        error: 'You are on the waitlist for this event. Only confirmed attendees can check in.',
        waitlisted: true
      }, { status: 403 });
    }

    // Check if already checked in
    if (attendee.status === 'attended') {
      await client.close();
      return NextResponse.json({ 
        success: true,
        message: 'You are already checked in!',
        alreadyCheckedIn: true,
        checkedInAt: attendee.attendedAt
      });
    }

    // Check them in
    const now = Date.now();
    console.log('Updating attendee:', attendee._id, 'to attended status');
    
    // Before update - let's verify this record still exists and check the whole collection state
    const preUpdateCheck = await db.collection('EventAttendance').findOne({ _id: attendee._id });
    console.log('Pre-update verification - record exists:', !!preUpdateCheck);
    if (preUpdateCheck) {
      console.log('Pre-update record:', {
        _id: preUpdateCheck._id,
        status: preUpdateCheck.status,
        email: preUpdateCheck.attendee?.umichEmail || preUpdateCheck.email
      });
    }
    
    // Let's also count total records for this event before and after
    const preUpdateEventCount = await db.collection('EventAttendance').countDocuments({ eventId: event.id });
    console.log('Total event attendees before update:', preUpdateEventCount);
    
    const updateResult = await db.collection('EventAttendance').updateOne(
      { _id: attendee._id },
      {
        $set: {
          status: 'attended',
          attendedAt: now
        }
      }
    );
    
    console.log('Update result:', updateResult.matchedCount, 'matched,', updateResult.modifiedCount, 'modified');
    
    // Post-update verification
    const postUpdateEventCount = await db.collection('EventAttendance').countDocuments({ eventId: event.id });
    console.log('Total event attendees after update:', postUpdateEventCount);
    if (preUpdateEventCount !== postUpdateEventCount) {
      console.log('ERROR: Record count changed from', preUpdateEventCount, 'to', postUpdateEventCount);
    }
    
    // Verify the update worked
    const updatedAttendee = await db.collection('EventAttendance').findOne({ _id: attendee._id });
    console.log('Updated attendee status:', updatedAttendee?.status);
    if (!updatedAttendee) {
      console.log('ERROR: Attendee record disappeared after update!');
    }

    await client.close();

    return NextResponse.json({ 
      success: true,
      message: 'Successfully checked in!',
      checkedInAt: now,
      attendeeName: attendee.attendee?.name || 'Unknown',
      eventTitle: event.title
    });

  } catch (error) {
    console.error('Self check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to verify QR code data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: eventSlug } = await params;
    const { searchParams } = new URL(request.url);
    const checkInCode = searchParams.get('checkInCode');
    const attendeeId = searchParams.get('attendeeId');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Find event by slug
    const event = await db.collection('Event').findOne({ slug: eventSlug });
    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // If no specific check-in code provided, just return event info
    if (!checkInCode && !attendeeId) {
      await client.close();
      return NextResponse.json({
        valid: true,
        eventTitle: event.title,
        eventDate: event.eventDate,
        eventLocation: event.location,
        generalEvent: true
      });
    }

    // Find the attendee record
    let query: any = { eventId: event.id };
    if (checkInCode) {
      query.checkInCode = checkInCode;
    } else {
      query.id = attendeeId;
    }

    const attendee = await db.collection('EventAttendance').findOne(query);

    await client.close();

    if (!attendee) {
      return NextResponse.json({ 
        error: 'Invalid check-in code or attendee not found',
        valid: false
      }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventLocation: event.location,
      attendeeName: attendee.attendee?.name || 'Unknown',
      attendeeEmail: attendee.attendee?.umichEmail || attendee.email,
      alreadyCheckedIn: attendee.status === 'attended',
      checkedInAt: attendee.attendedAt
    });

  } catch (error) {
    console.error('QR verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
