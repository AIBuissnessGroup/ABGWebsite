import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';

const client = createMongoClient();

// POST /api/interviews/slots/[id]/book - Book a specific slot
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const { id: slotId } = await params;
    
    if (!slotId) {
      return NextResponse.json({ error: 'Missing slot ID' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Check if user's email is in the whitelist
    const whitelistEntry = await db.collection('InterviewWhitelist').findOne({ 
      email: session.user.email.toLowerCase() 
    });

    if (!whitelistEntry) {
      return NextResponse.json({ 
        error: 'Your email is not approved for interview signups. Please contact the admin team.' 
      }, { status: 403 });
    }

    // Check if user already has a booking for any interview slot (one slot per user rule)
    const existingBooking = await db.collection('InterviewSlot').findOne({
      bookedByUserId: session.user.id
    });

    if (existingBooking) {
      return NextResponse.json({ 
        error: 'You can only book one interview slot. Please cancel your existing booking first.' 
      }, { status: 400 });
    }

    // Find the specific slot
    let slot;
    if (ObjectId.isValid(slotId)) {
      slot = await db.collection('InterviewSlot').findOne({ _id: new ObjectId(slotId) });
    } else {
      slot = await db.collection('InterviewSlot').findOne({ id: slotId });
    }

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.status === 'booked') {
      return NextResponse.json({ error: 'Slot is already booked' }, { status: 400 });
    }

    // Check if slot is in the past (based on start time)
    const slotStartTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
    const now = new Date();
    
    if (slotStartTime <= now) {
      return NextResponse.json({ error: 'Cannot book past slots' }, { status: 400 });
    }

    // Extract uniqname from email (everything before @umich.edu)
    const uniqname = session.user.email.split('@')[0];

    // Create booking data
    const bookingData = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userEmail: session.user.email,
      userName: session.user.name || null,
      uniqname: uniqname,
      createdAt: new Date(),
    };

    // Update the slot to booked status
    const updateResult = await db.collection('InterviewSlot').updateOne(
      { _id: slot._id },
      { 
        $set: { 
          status: 'booked',
          bookedByUserId: session.user.id,
          signup: bookingData,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to book slot' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully booked interview slot',
      booking: bookingData
    });

  } catch (error) {
    console.error('Error booking interview slot:', error);
    return NextResponse.json({ error: 'Failed to book slot' }, { status: 500 });
  } finally {
    await client.close();
  }
}