import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendBulkSMS } from '@/lib/sms';

const client = new MongoClient(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email?.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { eventId, message, recipients } = await request.json();

    if (!eventId || !message) {
      return NextResponse.json({ error: 'Event ID and message required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();
    
    // Get event details
    const event = await db.collection('Event').findOne({ id: eventId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event requires phone numbers
    if (!event.requirePhone) {
      return NextResponse.json({ 
        error: 'SMS can only be sent for events that require phone numbers' 
      }, { status: 400 });
    }

    // Build query based on recipients
    let query: any = { eventId: eventId };
    
    if (recipients === 'confirmed') {
      query.status = 'confirmed';
    } else if (recipients === 'waitlisted') {
      query.status = 'waitlisted';
    }
    // 'all' means no additional filter

    // Get attendees with phone numbers
    const attendees = await db.collection('EventAttendance').find(query).toArray();

    console.log('📱 SMS Debug - Total attendees found:', attendees.length);
    console.log('📱 SMS Debug - Sample attendee structure:', attendees[0] ? {
      hasPhone: !!attendees[0].phone,
      phone: attendees[0].phone,
      hasAttendeePhone: !!attendees[0].attendee?.phone,
      attendeePhone: attendees[0].attendee?.phone,
      status: attendees[0].status
    } : 'No attendees');

    // Filter for attendees with phone numbers - check both possible locations
    const attendeesWithPhones = attendees.filter((attendee: any) => {
      const phone = attendee.phone || attendee.attendee?.phone;
      return phone && phone.trim();
    });

    console.log('📱 SMS Debug - Attendees with phones:', attendeesWithPhones.length);

    if (attendeesWithPhones.length === 0) {
      return NextResponse.json({ 
        error: 'No attendees found with phone numbers' 
      }, { status: 400 });
    }

    // Prepare SMS messages with carrier-compliant format
    const smsMessages = attendeesWithPhones.map((attendee: any) => {
      const phone = attendee.phone || attendee.attendee?.phone;
      
      // For trial accounts, keep messages extremely simple
      const compliantMessage = message.length > 50 ? 
        `${message.substring(0, 47)}...` : 
        message;
      
      console.log('📱 Sending SMS:', {
        to: phone,
        message: compliantMessage,
        length: compliantMessage.length,
        isTrialAccount: !process.env.TWILIO_ACCOUNT_UPGRADED // Add this env var when you upgrade
      });
      
      return {
        to: phone,
        message: compliantMessage,
        eventTitle: event.title
      };
    });

    // Send SMS messages
    const result = await sendBulkSMS(smsMessages);

    // Log the SMS send in event updates
    const updateEntry = {
      title: 'SMS Alert Sent',
      message: message,
      type: 'sms',
      recipients: recipients,
      timestamp: new Date(),
      sentBy: session.user.email,
      deliveryStats: {
        total: attendeesWithPhones.length,
        sent: result.sent,
        failed: result.failed
      }
    };

    // Check if updates field exists and is an array, if not initialize it
    const eventDoc = await db.collection('Event').findOne({ id: eventId });
    if (!eventDoc?.updates || !Array.isArray(eventDoc.updates)) {
      // Initialize updates as an array if it doesn't exist or isn't an array
      await db.collection('Event').updateOne(
        { id: eventId },
        { $set: { updates: [updateEntry] } } as any
      );
    } else {
      // Push to existing array
      await db.collection('Event').updateOne(
        { id: eventId },
        { $push: { updates: updateEntry } } as any
      );
    }

    return NextResponse.json({
      success: true,
      message: `SMS sent to ${result.sent} attendees`,
      stats: {
        totalEligible: attendeesWithPhones.length,
        sent: result.sent,
        failed: result.failed
      }
    });

  } catch (error) {
    console.error('Send SMS error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}