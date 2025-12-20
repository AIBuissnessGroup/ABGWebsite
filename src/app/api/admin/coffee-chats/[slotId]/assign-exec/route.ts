import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';

// Create a new client for each request to avoid connection issues
function createMongoClient() {
  return createMongoClient();
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createMongoClient();
  try {
    const { slotId, execMemberId, execName, execEmail } = await request.json();

    if (!slotId || !execMemberId) {
      return NextResponse.json({ error: 'Slot ID and exec member ID are required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Update the slot with exec member info
    let updateQuery;
    if (ObjectId.isValid(slotId)) {
      updateQuery = { _id: new ObjectId(slotId) };
    } else {
      updateQuery = { id: slotId };
    }

    const updateData = {
      execMemberId,
      hostName: execName || '',
      hostEmail: execEmail || '',
      updatedAt: new Date()
    };

    const result = await db.collection('CoffeeChat').updateOne(
      updateQuery,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Get the updated slot
    const updatedSlot = await db.collection('CoffeeChat').findOne(updateQuery);

    if (!updatedSlot) {
      return NextResponse.json({ error: 'Slot not found after update' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      slot: {
        id: updatedSlot.id || updatedSlot._id.toString(),
        execMemberId: updatedSlot.execMemberId,
        hostName: updatedSlot.hostName,
        hostEmail: updatedSlot.hostEmail,
      }
    });
  } catch (error) {
    console.error('Error assigning exec to slot:', error);
    return NextResponse.json({ error: 'Failed to assign exec member' }, { status: 500 });
  } finally {
    await client.close();
  }
}
