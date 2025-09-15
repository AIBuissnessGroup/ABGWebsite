import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { title, message, recipients, type = 'info' } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    if (!['all', 'confirmed', 'waitlist'].includes(recipients)) {
      return NextResponse.json({ error: 'Invalid recipients value' }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Verify event exists
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    });

    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get recipients based on selection
    let recipientFilter: any = { eventId: eventId };
    
    switch (recipients) {
      case 'confirmed':
        recipientFilter.status = 'confirmed';
        break;
      case 'waitlist':
        recipientFilter.status = 'waitlisted';
        break;
      case 'all':
        recipientFilter.status = { $in: ['confirmed', 'waitlisted'] };
        break;
    }

    const attendees = await db.collection('EventAttendance').find(recipientFilter).toArray();

    if (attendees.length === 0) {
      await client.close();
      return NextResponse.json({ error: 'No attendees found for the selected criteria' }, { status: 400 });
    }

    // Create update record
    const updateId = new ObjectId().toString();
    const eventUpdate = {
      id: updateId,
      title,
      message,
      sentAt: Date.now(),
      sentBy: 'admin', // TODO: Get from session/auth
      recipients,
      type,
      eventId,
      recipientCount: attendees.length
    };

    // Add update to event's update history
    await db.collection('Event').updateOne(
      { id: eventId },
      {
        $push: {
          'updates.history': eventUpdate as any
        } as any,
        $set: {
          'updates.enabled': true,
          updatedAt: Date.now()
        }
      }
    );

    // Create individual update records for tracking
    const updateRecords = attendees.map((attendee: any) => ({
      id: new ObjectId().toString(),
      updateId: updateId,
      eventId: eventId,
      attendeeId: attendee.id,
      email: attendee.attendee.umichEmail,
      phone: attendee.attendee.phone,
      status: 'pending',
      sentAt: Date.now(),
      emailSent: false,
      smsSent: false
    }));

    await db.collection('EventUpdateDelivery').insertMany(updateRecords);

    // TODO: Send emails and SMS
    await sendNotifications(attendees, eventUpdate, event);

    await client.close();

    return NextResponse.json({ 
      success: true, 
      updateId: updateId,
      recipientCount: attendees.length
    });

  } catch (error) {
    console.error('Event update broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send update' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Get event with updates
    const event = await db.collection('Event').findOne({
      id: eventId,
      published: true
    });

    if (!event) {
      await client.close();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updates = event.updates?.history || [];
    
    // Get delivery statistics for each update
    const updatesWithStats = await Promise.all(
      updates.map(async (update: any) => {
        const deliveryStats = await db.collection('EventUpdateDelivery').aggregate([
          { $match: { updateId: update.id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]).toArray();

        const stats = deliveryStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, { pending: 0, sent: 0, failed: 0 });

        return {
          ...update,
          deliveryStats: stats
        };
      })
    );

    await client.close();

    return NextResponse.json({
      updates: updatesWithStats,
      total: updates.length
    });

  } catch (error) {
    console.error('Get event updates error:', error);
    return NextResponse.json({ error: 'Failed to get updates' }, { status: 500 });
  }
}

// TODO: Implement actual email/SMS sending
async function sendNotifications(attendees: any[], update: any, event: any) {
  console.log(`Sending update "${update.title}" to ${attendees.length} attendees for event "${event.title}"`);
  
  // Here you would integrate with:
  // - Email service (SendGrid, AWS SES, etc.)
  // - SMS service (Twilio, AWS SNS, etc.)
  
  // For now, just log the details
  attendees.forEach((attendee: any) => {
    console.log(`- Email: ${attendee.attendee.umichEmail}`);
    if (attendee.attendee.phone) {
      console.log(`- SMS: ${attendee.attendee.phone}`);
    }
  });
}