import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

type Slot = {
  id: string;
  title: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  location: string;
  hostName: string;
  hostEmail: string;
  capacity: number;
  isOpen: boolean;
  execMemberId?: string;
  signups: Array<{
    id: string;
    userEmail: string;
    userName: string | null;
    phone?: string;
    createdAt: string;
  }>;
  signupCount: number;
};

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await client.connect();
    const db = client.db();

    const slots = await db.collection('CoffeeChat').find({}).sort({ startTime: 1 }).toArray();
    
    // Get all team members for populating exec member data
    const teamMembers = await db.collection('TeamMember').find({}).toArray();
    const teamMemberMap = new Map(teamMembers.map(member => [member.id, member]));

    // Transform the data to match the expected format
    const transformedSlots: Slot[] = slots.map((slot: any) => {
      const execMember = slot.execMemberId ? teamMemberMap.get(slot.execMemberId) : null;
      
      return {
        id: slot.id || slot._id.toString(),
        title: slot.title,
        startTime: slot.startTime instanceof Date ? slot.startTime.toISOString() : slot.startTime,
        endTime: slot.endTime instanceof Date ? slot.endTime.toISOString() : slot.endTime,
        location: slot.location,
        hostName: slot.hostName,
        hostEmail: slot.hostEmail,
        capacity: slot.capacity,
        isOpen: slot.isOpen,
        execMemberId: slot.execMemberId,
        execMember: execMember ? {
          id: execMember.id,
          name: execMember.name,
          role: execMember.role,
          email: execMember.email
        } : null,
        signups: (slot.signups || []).map((signup: any) => ({
          id: signup.id,
          userEmail: signup.userEmail,
          userName: signup.userName,
          phone: signup.phone, // Include phone for admin view
          createdAt: signup.createdAt instanceof Date ? signup.createdAt.toISOString() : signup.createdAt,
        })),
        signupCount: (slot.signups || []).length,
      };
    });

    return NextResponse.json(transformedSlots);
  } catch (error) {
    console.error('Error fetching coffee chat slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Creating coffee chat slot with data:', body);
    console.log('User email:', session.user.email);
    console.log('User roles:', session.user.roles);
    
    const { title, startTime, endTime, location, hostName, hostEmail, capacity } = body;

    if (!title || !startTime || !endTime || !location || !hostName || !hostEmail || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const newSlot = {
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'Coffee Chat',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      hostName,
      hostEmail,
      capacity: Number(capacity || 1),
      isOpen: body.isOpen ?? true,
      signups: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.email,
    };

    const result = await db.collection('CoffeeChat').insertOne(newSlot);
    console.log('Successfully created slot:', result.insertedId);

    const transformedSlot: Slot = {
      id: newSlot.id,
      title: newSlot.title,
      startTime: newSlot.startTime.toISOString(),
      endTime: newSlot.endTime.toISOString(),
      location: newSlot.location,
      hostName: newSlot.hostName,
      hostEmail: newSlot.hostEmail,
      capacity: newSlot.capacity,
      isOpen: newSlot.isOpen,
      signups: [],
      signupCount: 0,
    };

    return NextResponse.json(transformedSlot);
  } catch (error) {
    console.error('Error creating coffee chat slot:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({ error: 'Failed to create slot', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Missing slot ID' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.hostName !== undefined) updateData.hostName = body.hostName;
    if (body.hostEmail !== undefined) updateData.hostEmail = body.hostEmail;
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    if (body.isOpen !== undefined) updateData.isOpen = body.isOpen;

    // Try to find by custom id first, then by MongoDB _id
    let result;
    if (ObjectId.isValid(body.id)) {
      result = await db.collection('CoffeeChat').updateOne(
        { _id: new ObjectId(body.id) },
        { $set: updateData }
      );
    } else {
      result = await db.collection('CoffeeChat').updateOne(
        { id: body.id },
        { $set: updateData }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Fetch the updated slot
    let updatedSlot;
    if (ObjectId.isValid(body.id)) {
      updatedSlot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(body.id) });
    } else {
      updatedSlot = await db.collection('CoffeeChat').findOne({ id: body.id });
    }

    if (!updatedSlot) {
      return NextResponse.json({ error: 'Slot not found after update' }, { status: 404 });
    }

    const transformedSlot: Slot = {
      id: updatedSlot.id || updatedSlot._id.toString(),
      title: updatedSlot.title,
      startTime: updatedSlot.startTime instanceof Date ? updatedSlot.startTime.toISOString() : updatedSlot.startTime,
      endTime: updatedSlot.endTime instanceof Date ? updatedSlot.endTime.toISOString() : updatedSlot.endTime,
      location: updatedSlot.location,
      hostName: updatedSlot.hostName,
      hostEmail: updatedSlot.hostEmail,
      capacity: updatedSlot.capacity,
      isOpen: updatedSlot.isOpen,
      signups: (updatedSlot.signups || []).map((signup: any) => ({
        id: signup.id,
        userEmail: signup.userEmail,
        userName: signup.userName,
        createdAt: signup.createdAt instanceof Date ? signup.createdAt.toISOString() : signup.createdAt,
      })),
      signupCount: (updatedSlot.signups || []).length,
    };

    return NextResponse.json(transformedSlot);
  } catch (error) {
    console.error('Error updating coffee chat slot:', error);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, slotId, signupId } = body;

    if (action === 'removeHost' && slotId) {
      await client.connect();
      const db = client.db();

      // First find the slot
      let existingSlot;
      if (ObjectId.isValid(slotId)) {
        existingSlot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(slotId) });
      } else {
        existingSlot = await db.collection('CoffeeChat').findOne({ id: slotId });
      }

      if (!existingSlot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      // Check if the current user is the host
      if (existingSlot.hostEmail !== session.user.email) {
        return NextResponse.json({ error: 'You can only remove yourself as host' }, { status: 403 });
      }

      // Remove host information (set to empty strings)
      let updateQuery;
      if (ObjectId.isValid(slotId)) {
        updateQuery = { _id: new ObjectId(slotId) };
      } else {
        updateQuery = { id: slotId };
      }
      
      await db.collection('CoffeeChat').updateOne(
        updateQuery,
        { 
          $set: { 
            hostName: '', 
            hostEmail: '', 
            updatedAt: new Date() 
          } 
        }
      );

      // Return updated slot data
      let updatedSlot;
      if (ObjectId.isValid(slotId)) {
        updatedSlot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(slotId) });
      } else {
        updatedSlot = await db.collection('CoffeeChat').findOne({ id: slotId });
      }

      if (!updatedSlot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      const transformedSlot: Slot = {
        id: updatedSlot.id || updatedSlot._id.toString(),
        title: updatedSlot.title,
        startTime: updatedSlot.startTime instanceof Date ? updatedSlot.startTime.toISOString() : updatedSlot.startTime,
        endTime: updatedSlot.endTime instanceof Date ? updatedSlot.endTime.toISOString() : updatedSlot.endTime,
        location: updatedSlot.location,
        hostName: updatedSlot.hostName,
        hostEmail: updatedSlot.hostEmail,
        capacity: updatedSlot.capacity,
        isOpen: updatedSlot.isOpen,
        signups: (updatedSlot.signups || []).map((signup: any) => ({
          id: signup.id,
          userEmail: signup.userEmail,
          userName: signup.userName,
          createdAt: signup.createdAt instanceof Date ? signup.createdAt.toISOString() : signup.createdAt,
        })),
        signupCount: (updatedSlot.signups || []).length,
      };

      return NextResponse.json(transformedSlot);
    }

    if (action === 'removeSignup' && slotId && signupId) {
      await client.connect();
      const db = client.db();

      // First find the slot
      let existingSlot;
      if (ObjectId.isValid(slotId)) {
        existingSlot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(slotId) });
      } else {
        existingSlot = await db.collection('CoffeeChat').findOne({ id: slotId });
      }

      if (!existingSlot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      // Remove the signup from the signups array
      const updatedSignups = (existingSlot.signups || []).filter((signup: any) => signup.id !== signupId);
      
      // Update the slot with the new signups array
      let updateQuery;
      if (ObjectId.isValid(slotId)) {
        updateQuery = { _id: new ObjectId(slotId) };
      } else {
        updateQuery = { id: slotId };
      }
      
      await db.collection('CoffeeChat').updateOne(
        updateQuery,
        { $set: { signups: updatedSignups, updatedAt: new Date() } }
      );

      // Return updated slot data
      let updatedSlot;
      if (ObjectId.isValid(slotId)) {
        updatedSlot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(slotId) });
      } else {
        updatedSlot = await db.collection('CoffeeChat').findOne({ id: slotId });
      }

      if (!updatedSlot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      const transformedSlot: Slot = {
        id: updatedSlot.id || updatedSlot._id.toString(),
        title: updatedSlot.title,
        startTime: updatedSlot.startTime instanceof Date ? updatedSlot.startTime.toISOString() : updatedSlot.startTime,
        endTime: updatedSlot.endTime instanceof Date ? updatedSlot.endTime.toISOString() : updatedSlot.endTime,
        location: updatedSlot.location,
        hostName: updatedSlot.hostName,
        hostEmail: updatedSlot.hostEmail,
        capacity: updatedSlot.capacity,
        isOpen: updatedSlot.isOpen,
        signups: (updatedSlot.signups || []).map((signup: any) => ({
          id: signup.id,
          userEmail: signup.userEmail,
          userName: signup.userName,
          createdAt: signup.createdAt instanceof Date ? signup.createdAt.toISOString() : signup.createdAt,
        })),
        signupCount: (updatedSlot.signups || []).length,
      };

      return NextResponse.json(transformedSlot);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error removing signup:', error);
    return NextResponse.json({ error: 'Failed to remove signup' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await client.connect();
    const db = client.db();

    let result;
    if (ObjectId.isValid(id)) {
      result = await db.collection('CoffeeChat').deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await db.collection('CoffeeChat').deleteOne({ id: id });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting coffee chat slot:', error);
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
  } finally {
    await client.close();
  }
}

