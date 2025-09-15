import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { Event, EventAttendance } from '../../../../../types/events';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { name, umichEmail, major, gradeLevel, phone, password } = body;

    if (!umichEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get event details
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    }) as any; // Use any to access database fields directly

    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if attendance confirmation is enabled
    if (!event.attendanceConfirmEnabled) {
      await client.close();
      return NextResponse.json({ error: 'Attendance confirmation is not enabled for this event' }, { status: 400 });
    }

    // Validate password if required
    if (event.attendancePasswordHash) {
      if (!password) {
        await client.close();
        return NextResponse.json({ error: 'Password is required for this event' }, { status: 401 });
      }
      // TODO: Validate password hash here if needed
    }

    // Validate UMich email (always required for attendance confirmation)
    if (!umichEmail.endsWith('@umich.edu')) {
      await client.close();
      return NextResponse.json({ error: 'Must use a University of Michigan email address' }, { status: 400 });
    }

    // Check if already registered
    const existingRegistration = await db.collection('EventAttendance').findOne({
      eventId: eventId,
      'attendee.umichEmail': umichEmail
    });

    if (existingRegistration) {
      await client.close();
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 });
    }

    // Get current attendance numbers
    const confirmedCount = await db.collection('EventAttendance').countDocuments({
      eventId: eventId,
      status: 'confirmed'
    });

    const waitlistCount = await db.collection('EventAttendance').countDocuments({
      eventId: eventId,
      status: 'waitlisted'
    });

    // Check capacity
    const isAtCapacity = event.capacity && confirmedCount >= event.capacity;
    const willBeWaitlisted = isAtCapacity && event.waitlistEnabled;

    if (isAtCapacity && !event.waitlistEnabled) {
      await client.close();
      return NextResponse.json({ error: 'Event is at full capacity and waitlist is not enabled' }, { status: 400 });
    }

    // Check waitlist capacity
    if (willBeWaitlisted && event.waitlistMaxSize && waitlistCount >= event.waitlistMaxSize) {
      await client.close();
      return NextResponse.json({ error: 'Waitlist is also full' }, { status: 400 });
    }

    // Generate unique ID and check-in code
    const attendanceId = new ObjectId().toString();
    const checkInCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create attendance record
    const attendance: EventAttendance = {
      id: attendanceId,
      eventId: eventId,
      attendee: {
        name: name || undefined,
        umichEmail,
        major: major || undefined,
        gradeLevel: gradeLevel || undefined,
        phone: phone || undefined
      },
      status: willBeWaitlisted ? 'waitlisted' : 'confirmed',
      registeredAt: Date.now(),
      confirmedAt: willBeWaitlisted ? undefined : Date.now(),
      waitlistPosition: willBeWaitlisted ? waitlistCount + 1 : undefined,
      source: 'website',
      reminders: {
        emailSent: false,
        smsSent: false
      },
      checkInCode
    };

    // Insert attendance record
    await db.collection('EventAttendance').insertOne(attendance);

    // Update user profile if additional information was provided
    if (name || major || gradeLevel || phone) {
      try {
        const updateFields: any = {};
        if (name) updateFields['name'] = name;
        if (major) updateFields['profile.major'] = major;
        if (gradeLevel) {
          // Convert grade level to graduation year estimate
          const currentYear = new Date().getFullYear();
          const gradYear = currentYear + (4 - parseInt(gradeLevel));
          updateFields['profile.graduationYear'] = gradYear;
        }
        if (phone) updateFields['profile.phone'] = phone;
        updateFields['updatedAt'] = new Date();

        await db.collection('users').updateOne(
          { email: umichEmail },
          { $set: updateFields },
          { upsert: false } // Don't create if user doesn't exist
        );
      } catch (profileError) {
        console.error('Error updating user profile:', profileError);
        // Don't fail the attendance registration if profile update fails
      }
    }

    // Update event statistics if confirmed
    if (!willBeWaitlisted) {
      // We could update a counter here, but for now we'll calculate on demand
    }

    // TODO: Send confirmation email
    // TODO: Send SMS if phone provided and SMS enabled

    await client.close();

    return NextResponse.json({ 
      success: true, 
      attendanceId: attendanceId,
      status: attendance.status,
      waitlistPosition: attendance.waitlistPosition,
      checkInCode: attendance.checkInCode
    });

  } catch (error) {
    console.error('Attendance registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    const registration = await db.collection('EventAttendance').findOne({
      eventId: eventId,
      'attendee.umichEmail': email
    }) as EventAttendance | null;

    await client.close();

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    return NextResponse.json(registration);

  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json({ error: 'Failed to get registration' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🔍 Cancel attendance - Event ID:', eventId, 'Email:', email);

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get event details
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    }) as any;

    if (!event) {
      console.log('❌ Event not found:', eventId);
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    console.log('✅ Event found:', event.title);

    // Find the registration to cancel
    const registration = await db.collection('EventAttendance').findOne({
      eventId: eventId,
      $or: [
        { email: email },
        { 'attendee.umichEmail': email },
        { 'attendee.email': email }
      ]
    });

    console.log('🔍 Registration search result:', registration ? 'Found' : 'Not found');
    if (registration) {
      console.log('📋 Registration details:', {
        id: registration._id,
        status: registration.status,
        email: registration.email || registration.attendee?.umichEmail || registration.attendee?.email
      });
    }

    if (!registration) {
      // Debug: Let's see what registrations exist for this event
      const allRegistrations = await db.collection('EventAttendance').find({ eventId: eventId }).toArray();
      console.log('🔍 All registrations for event:', allRegistrations.map(r => ({
        id: r._id,
        email: r.email,
        attendeeEmail: r.attendee?.umichEmail || r.attendee?.email,
        status: r.status
      })));
      
      await client.close();
      return NextResponse.json({ error: 'Registration not found for this email' }, { status: 404 });
    }

    // If this person was waitlisted, update positions for people behind them
    if (registration.status === 'waitlisted') {
      await db.collection('EventAttendance').updateMany(
        {
          eventId: eventId,
          status: 'waitlisted',
          waitlistPosition: { $gt: registration.waitlistPosition }
        },
        {
          $inc: { waitlistPosition: -1 }
        }
      );
    }

    // Remove the registration
    await db.collection('EventAttendance').deleteOne({
      _id: registration._id
    });

    let promotionMessage = '';

    // If a confirmed attendee was removed, try to promote someone from waitlist
    if (registration.status === 'confirmed' && event.capacity) {
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

          promotionMessage = `. ${nextWaitlisted.attendee?.name || nextWaitlisted.attendee?.umichEmail} has been automatically promoted from the waitlist.`;
        }
      }
    }

    await client.close();

    return NextResponse.json({ 
      success: true,
      message: `Registration cancelled successfully${promotionMessage}`
    });

  } catch (error) {
    console.error('Cancel registration error:', error);
    return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 });
  }
}