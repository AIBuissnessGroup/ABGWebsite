import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';
import { bulkVerifyPhoneNumbers } from '@/lib/phone-verification';

const client = new MongoClient(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email?.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
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
        error: 'This event does not collect phone numbers' 
      }, { status: 400 });
    }

    // Get all attendees with phone numbers for this event
    const attendees = await db.collection('EventAttendance').find({
      eventId: eventId
    }).toArray();

    // Extract phone numbers
    const phoneNumbers = attendees
      .map((attendee: any) => attendee.phone || attendee.attendee?.phone)
      .filter((phone: string) => phone && phone.trim())
      .map((phone: string) => phone.trim());

    if (phoneNumbers.length === 0) {
      return NextResponse.json({ 
        error: 'No phone numbers found for this event' 
      }, { status: 400 });
    }

    console.log(`📱 Found ${phoneNumbers.length} phone numbers for verification`);

    // Verify all phone numbers
    const result = await bulkVerifyPhoneNumbers(phoneNumbers);

    return NextResponse.json({
      success: true,
      message: `Phone verification initiated for ${result.verified.length} numbers`,
      stats: {
        total: phoneNumbers.length,
        verificationInitiated: result.verified.length,
        alreadyVerified: result.alreadyVerified.length,
        failed: result.failed.length
      },
      details: {
        initiated: result.verified,
        alreadyVerified: result.alreadyVerified,
        failed: result.failed
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify phone numbers' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}