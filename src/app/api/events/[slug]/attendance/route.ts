import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { canRegisterForEvent } from '@/lib/roles';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import type { UserRole } from '@/types/next-auth';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

// Create a new client for each request to avoid connection issues
function createMongoClient() {
  return new MongoClient(uri);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const client = createMongoClient();
  try {
    const { slug } = await params; // Await params before accessing properties
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This is for regular users to view their own attendance status
    // No admin check needed here

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const countOnly = searchParams.get('countOnly') === '1';

    await client.connect();
    const db = client.db();

    console.log('🔍 Attendance API - Event Slug:', slug);

    // Find event by slug first to get the event ID
    const event = await db.collection('Event').findOne({ slug: slug });
    if (!event) {
      console.log('❌ Event not found with slug:', slug);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    console.log('✅ Event found:', event.title);

    if (countOnly) {
      const count = await db.collection('EventAttendance').countDocuments({ eventId: event.id });
      return NextResponse.json({ count });
    }

    const attendees = await db.collection('EventAttendance')
      .find({ eventId: event.id })
      .sort({ confirmedAt: -1, waitlistPosition: 1 })
      .toArray();

    console.log('📊 Found attendees:', attendees.length);

    const total = attendees.length;
    
    // Separate confirmed and waitlisted attendees
    const confirmed = attendees.filter(a => a.status === 'confirmed');
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
          'Content-Disposition': `attachment; filename="event-${event.id}-attendance.csv"`
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

// Register for event (POST) - for users to register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: eventSlug } = await params;
    const attendeeData = await request.json();
    
    const session = await getServerSession(authOptions);
    
    // Require authentication
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the email matches the session
    if (session.user.email !== attendeeData.umichEmail) {
      return NextResponse.json({ error: 'Email must match your authenticated account' }, { status: 403 });
    }

    if (!attendeeData.umichEmail || !attendeeData.umichEmail.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'Valid UMich email is required' }, { status: 400 });
    }

    console.log('🔍 Event registration - Event Slug:', eventSlug, 'Email:', attendeeData.umichEmail);

    const client = createMongoClient();
    await client.connect();
    const db = client.db();

    // Find event by slug - use the same logic as the event page
    let event = await db.collection('Event').findOne({ 
      $and: [
        {
          $or: [
            { slug: eventSlug },
            { id: eventSlug }
          ]
        },
        {
          $or: [
            { published: true },
            { published: 1 }
          ]
        }
      ]
    }) as any;
    
    if (!event) {
      console.log('🔍 Event not found by slug or id, trying flexible search...');
      // Try finding by title-based slug generation
      const allEvents = await db.collection('Event').find({ 
        $or: [{ published: true }, { published: 1 }] 
      }).toArray();
      
      // Try to match by generating slug from title
      for (const e of allEvents) {
        const generatedSlug = e.title?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        if (generatedSlug === eventSlug) {
          event = e;
          console.log('✅ Found event by generated slug match:', e.title);
          break;
        }
      }
      
      if (!event) {
        console.log('❌ Event not found. Available events:', allEvents.slice(0, 3).map(e => ({
          id: e.id,
          slug: e.slug,
          title: e.title
        })));
        await client.close();
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
    }

    console.log('✅ Event found for registration:', event.title);

    // Check role-gated registration requirements
    if (event.registration?.enabled && event.registration?.requiredRolesAny?.length > 0) {
      console.log('🔒 Role-gated registration enabled. Required roles:', event.registration.requiredRolesAny);
      
      // Check if user has any of the required roles
      const userRoles = session.user.roles || ['USER'];
      const requiredRoles = event.registration.requiredRolesAny as UserRole[];
      
      if (!canRegisterForEvent(userRoles, requiredRoles)) {
        console.log('❌ User lacks required role. User roles:', userRoles, 'Required roles:', event.registration.requiredRolesAny);
        
        // Log role gate failure to audit system
        const { ip, userAgent } = getRequestMetadata(request);
        
        await logAuditEvent(
          session.user.id || 'unknown',
          session.user.email,
          'event.registration_role_gate_failed',
          'Event',
          {
            targetId: event.id,
            meta: {
              eventTitle: event.title,
              userRoles,
              requiredRoles: event.registration.requiredRolesAny
            },
            ip,
            userAgent
          }
        );
        
        await client.close();
        return NextResponse.json({ 
          error: 'You do not have the required permissions to register for this event. Please contact an administrator if you believe this is an error.',
          requiredRoles: event.registration.requiredRolesAny
        }, { status: 403 });
      }
      
      console.log('✅ User has required role for registration');
    }

    // Check if already registered
    const existingRegistration = await db.collection('EventAttendance').findOne({
      eventId: event.id,
      $or: [
        { email: attendeeData.umichEmail },
        { 'attendee.umichEmail': attendeeData.umichEmail }
      ]
    });

    if (existingRegistration) {
      await client.close();
      return NextResponse.json({ 
        error: 'You are already registered for this event',
        status: existingRegistration.status
      }, { status: 400 });
    }

    // Validate custom fields if they exist
    if (event.customFields && event.customFields.length > 0) {
      const customFieldResponses = attendeeData.customFields || {};
      
      for (const field of event.customFields) {
        if (field.required) {
          const response = customFieldResponses[field.id];
          if (!response || (typeof response === 'string' && !response.trim())) {
            await client.close();
            return NextResponse.json({ 
              error: `${field.label} is required` 
            }, { status: 400 });
          }
        }
      }
    }

    // Check capacity and determine status
    let status = 'confirmed';
    let waitlistPosition = null;

    if (event.capacity) {
      const confirmedCount = await db.collection('EventAttendance').countDocuments({
        eventId: event.id,
        status: 'confirmed'
      });

      if (confirmedCount >= event.capacity) {
        status = 'waitlisted';
        const waitlistCount = await db.collection('EventAttendance').countDocuments({
          eventId: event.id,
          status: 'waitlisted'
        });
        waitlistPosition = waitlistCount + 1;
      }
    }

    // Create registration
    const registration = {
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      attendee: {
        name: attendeeData.name,
        umichEmail: attendeeData.umichEmail,
        major: attendeeData.major,
        gradeLevel: attendeeData.gradeLevel,
        phone: attendeeData.phone
      },
      customFieldResponses: attendeeData.customFields || {}, // Store custom field responses
      status: status,
      registeredAt: Date.now(),
      ...(waitlistPosition && { waitlistPosition })
    };

    await db.collection('EventAttendance').insertOne(registration);
    await client.close();

    return NextResponse.json({ 
      success: true,
      message: status === 'confirmed' ? 'Successfully registered for the event!' : `You have been added to the waitlist (position ${waitlistPosition})`,
      status: status,
      ...(waitlistPosition && { waitlistPosition })
    });

  } catch (error) {
    console.error('Event registration error:', error);
    return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 });
  }
}

// Cancel attendance (DELETE) - for users to cancel their own registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: eventSlug } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    const session = await getServerSession(authOptions);
    
    // Require authentication
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Users can only cancel their own registration
    if (session.user.email !== email) {
      return NextResponse.json({ error: 'You can only cancel your own registration' }, { status: 403 });
    }

    if (!email || !email.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'Valid UMich email is required' }, { status: 400 });
    }

    console.log('🔍 Cancel attendance - Event Slug:', eventSlug, 'Email:', email);

    const client = createMongoClient();
    await client.connect();
    const db = client.db();

    // Get event details - use consistent logic with event page
    console.log('🔍 Looking for event with slug:', eventSlug);
    
    // Use the same logic as the event page and POST endpoint
    let event = await db.collection('Event').findOne({ 
      $and: [
        {
          $or: [
            { slug: eventSlug },
            { id: eventSlug }
          ]
        },
        {
          $or: [
            { published: true },
            { published: 1 }
          ]
        }
      ]
    }) as any;
    
    console.log('🔍 Event found by slug/id:', event ? 'YES' : 'NO');
    
    // If still not found, try a more flexible search
    if (!event) {
      console.log('🔍 Trying flexible search...');
      // Try finding by title-based slug generation
      const allEvents = await db.collection('Event').find({ 
        $or: [{ published: true }, { published: 1 }] 
      }).toArray();
      console.log('🔍 Total published events:', allEvents.length);
      
      // Try to match by generating slug from title
      for (const e of allEvents) {
        const generatedSlug = e.title?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        console.log('🔍 Checking event:', { title: e.title, slug: e.slug, generatedSlug, targetSlug: eventSlug });
        
        if (generatedSlug === eventSlug) {
          event = e;
          console.log('✅ Found event by generated slug match:', e.title);
          break;
        }
      }
    }
    
    // Debug: show what events exist if still not found
    if (!event) {
      const allEvents = await db.collection('Event').find({ published: true }).limit(5).toArray();
      console.log('🔍 Sample available events:', allEvents.map(e => ({
        id: e.id,
        _id: e._id,
        slug: e.slug,
        title: e.title
      })));
      
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    console.log('✅ Event found:', event.title);

    // Find the registration to cancel
    const registration = await db.collection('EventAttendance').findOne({
      eventId: event.id, // Use the event.id from the found event
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
      const allRegistrations = await db.collection('EventAttendance').find({ eventId: event.id }).toArray();
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
          eventId: event.id,
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
        eventId: event.id,
        status: 'confirmed'
      });

      console.log('Current confirmed count:', confirmedCount, 'Capacity:', event.capacity);

      if (confirmedCount < event.capacity) {
        // Find the next person on waitlist
        const nextWaitlisted = await db.collection('EventAttendance').findOne({
          eventId: event.id,
          status: 'waitlisted'
        }, {
          sort: { waitlistPosition: 1 }
        });

        if (nextWaitlisted) {
          // Promote them to confirmed
          await db.collection('EventAttendance').updateOne(
            { _id: nextWaitlisted._id },
            {
              $set: { status: 'confirmed' },
              $unset: { waitlistPosition: '' }
            }
          );

          // Update waitlist positions for everyone else
          await db.collection('EventAttendance').updateMany(
            {
              eventId: event.id,
              status: 'waitlisted',
              waitlistPosition: { $gt: nextWaitlisted.waitlistPosition }
            },
            {
              $inc: { waitlistPosition: -1 }
            }
          );

          promotionMessage = `. ${nextWaitlisted.attendee?.name || nextWaitlisted.attendee?.umichEmail} has been promoted from the waitlist.`;
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
