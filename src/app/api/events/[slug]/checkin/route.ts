import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

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

    const { checkInCode, attendeeId, photo } = await request.json();

    const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
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
    
    let attendee = await db.collection('EventAttendance').findOne(query);
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
      // Auto-register the user if they're not already registered
      console.log('No existing registration found, attempting auto-registration...');
      
      // Check if event allows registration (either registration or attendance confirmation enabled)
      if (!event.registrationEnabled && !event.attendanceConfirmEnabled) {
        await client.close();
        return NextResponse.json({ 
          error: 'Registration is not enabled for this event.',
          registered: false
        }, { status: 403 });
      }

      // Check if registration is still open (before event end time)
      const now = Date.now();
      const eventEndTime = event.endDate ? new Date(event.endDate).getTime() : null;
      
      if (eventEndTime && now > eventEndTime) {
        await client.close();
        return NextResponse.json({ 
          error: 'Registration for this event has ended.',
          registered: false
        }, { status: 403 });
      }

      // Auto-register the user using upsert to prevent race conditions
      try {
        const autoRegistration = {
          id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventId: event.id,
          attendee: {
            name: session.user.name || 'Unknown',
            umichEmail: session.user.email
          },
          status: 'confirmed', // Auto-confirm for check-in
          registeredAt: now,
          confirmedAt: now,
          source: 'checkin',
          checkInCode: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Use upsert to prevent duplicate registrations in case of race conditions
        const upsertResult = await db.collection('EventAttendance').updateOne(
          {
            eventId: event.id,
            $or: [
              { 'attendee.umichEmail': session.user.email },
              { email: session.user.email }
            ]
          },
          { $setOnInsert: autoRegistration },
          { upsert: true }
        );

        if (upsertResult.upsertedId) {
          console.log('Auto-registration successful:', upsertResult.upsertedId);
          attendee = { 
            ...autoRegistration, 
            _id: upsertResult.upsertedId 
          };
        } else {
          // Registration already existed (race condition), fetch it
          console.log('Registration already exists, fetching existing record');
          attendee = await db.collection('EventAttendance').findOne({
            eventId: event.id,
            $or: [
              { 'attendee.umichEmail': session.user.email },
              { email: session.user.email }
            ]
          });
        }
      } catch (autoRegError) {
        console.error('Auto-registration failed:', autoRegError);
        await client.close();
        return NextResponse.json({ 
          error: 'Failed to register for event. Please try again.',
          registered: false
        }, { status: 500 });
      }
    }

    // Ensure attendee exists at this point (should always be true after auto-registration)
    if (!attendee) {
      await client.close();
      return NextResponse.json({ 
        error: 'Unexpected error: No attendee record found.',
        registered: false
      }, { status: 500 });
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
          attendedAt: now,
          checkInPhoto: photo
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

    const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
    await client.connect();
    const db = client.db();

    // Find event by slug
    const event = await db.collection('Event').findOne({ slug: eventSlug });
    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // If no specific check-in code provided, check if current user is already checked in
    if (!checkInCode && !attendeeId) {
      const session = await getServerSession(authOptions);
      
      if (session?.user?.email) {
        // Look for the current user's check-in status
        const userAttendee = await db.collection('EventAttendance').findOne({
          eventId: event.id,
          $or: [
            { 'attendee.umichEmail': session.user.email },
            { email: session.user.email }
          ]
        });

        if (userAttendee) {
          await client.close();
          return NextResponse.json({
            valid: true,
            eventTitle: event.title,
            eventDate: event.eventDate,
            eventLocation: event.location,
            attendeeName: userAttendee.attendee?.name || 'Unknown',
            attendeeEmail: userAttendee.attendee?.umichEmail || userAttendee.email,
            alreadyCheckedIn: userAttendee.status === 'attended',
            checkedInAt: userAttendee.attendedAt,
            generalEvent: true
          });
        }
      }

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
