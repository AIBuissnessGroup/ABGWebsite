import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

// POST /api/interviews/slots/[id]/cancel - Cancel a booking
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

    if (slot.status !== 'booked' || slot.bookedByUserId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have a booking for this slot' }, { status: 400 });
    }

    // Check if cancellation is within 5 hours of start time
    const slotStartTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
    const now = new Date();
    const hoursUntilStart = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilStart <= 5) {
      return NextResponse.json({ 
        error: 'Cannot cancel within 5 hours of the interview start time' 
      }, { status: 400 });
    }

    // Update the slot to available status
    const updateResult = await db.collection('InterviewSlot').updateOne(
      { _id: slot._id },
      { 
        $set: { 
          status: 'available',
          updatedAt: new Date()
        },
        $unset: {
          bookedByUserId: "",
          signup: ""
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully cancelled interview slot booking'
    });

  } catch (error) {
    console.error('Error cancelling interview slot:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  } finally {
    await client.close();
  }
}