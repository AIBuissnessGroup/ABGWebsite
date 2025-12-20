import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { requireAdminSession } from '@/lib/server-admin';

const client = createMongoClient();

// POST /api/admin/interviews/slots/[id]/cancel - Admin cancel a booking
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const slotId = id;
    
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

    if (slot.status !== 'booked') {
      return NextResponse.json({ error: 'Slot is not currently booked' }, { status: 400 });
    }

    // Update the slot to available status (admin can cancel anytime)
    const updateResult = await db.collection('InterviewSlot').updateOne(
      { _id: slot._id },
      { 
        $set: { 
          status: 'available',
          updatedAt: new Date(),
          cancelledBy: session.user.email,
          cancelledAt: new Date()
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
      message: 'Successfully cancelled interview slot booking (admin action)'
    });

  } catch (error) {
    console.error('Error cancelling interview slot (admin):', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  } finally {
    await client.close();
  }
}
