import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

// Public GET with filtering support
export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db();
    const { searchParams } = new URL(request.url);

    // Build filter query
    let filter: any = { isOpen: true }; // Only show open slots to public

    // Day of week filter
    const dayOfWeek = searchParams.get('dayOfWeek');
    if (dayOfWeek) {
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayOfWeek);
      if (dayIndex !== -1) {
        filter.$expr = {
          $and: [
            { $eq: [{ $dayOfWeek: '$startTime' }, dayIndex + 1] },
            filter.$expr || {}
          ].filter(Boolean)
        };
      }
    }

    // Location filter
    const location = searchParams.get('location');
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Availability filter
    const availability = searchParams.get('availability');
    if (availability === 'available') {
      // Only show slots with open spots
      const availabilityFilter = { $lt: [{ $size: { $ifNull: ['$signups', []] } }, '$capacity'] };
      if (filter.$expr) {
        filter.$expr.$and.push(availabilityFilter);
      } else {
        filter.$expr = availabilityFilter;
      }
    } else if (availability === 'full') {
      const fullFilter = { $gte: [{ $size: { $ifNull: ['$signups', []] } }, '$capacity'] };
      if (filter.$expr) {
        filter.$expr.$and.push(fullFilter);
      } else {
        filter.$expr = fullFilter;
      }
    }

    // Host filter (for exec member filtering)
    const host = searchParams.get('host');
    if (host) {
      filter.hostName = { $regex: host, $options: 'i' };
    }

    const slots = await db.collection('CoffeeChat').find(filter).sort({ startTime: 1 }).toArray();

    // Transform the data to match the expected format
    const transformedSlots = slots.map(slot => ({
      id: slot.id || slot._id.toString(),
      title: slot.title,
      startTime: slot.startTime instanceof Date ? slot.startTime.toISOString() : slot.startTime,
      endTime: slot.endTime instanceof Date ? slot.endTime.toISOString() : slot.endTime,
      location: slot.location,
      hostName: slot.hostName,
      hostEmail: slot.hostEmail,
      capacity: slot.capacity,
      isOpen: slot.isOpen,
      signups: (slot.signups || []).map((signup: any) => ({
        ...signup,
        // Remove phone numbers for public view
        phone: undefined
      })),
      signupCount: (slot.signups || []).length,
      spotsRemaining: slot.capacity - (slot.signups || []).length,
      // Include exec member info if available
      execMember: slot.execMemberId ? {
        id: slot.execMemberId,
        name: slot.hostName,
        email: slot.hostEmail
      } : undefined
    }));

    return NextResponse.json(transformedSlots);
  } catch (error) {
    console.error('Error fetching coffee chat slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// Signup for a slot (UMich email required) with phone number
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slotId, phone } = body;
    if (!slotId) return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
    if (!phone || !phone.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });

    await client.connect();
    const db = client.db();

    // Check if user already has a signup for any coffee chat slot (single signup restriction)
    const existingSignups = await db.collection('CoffeeChat').find({
      'signups.userEmail': session.user.email
    }).toArray();

    if (existingSignups.length > 0) {
      return NextResponse.json({ 
        error: 'You can only sign up for one coffee chat slot. Please remove your existing signup first.' 
      }, { status: 400 });
    }

    // Check if slot exists and is open
    let slot;
    if (ObjectId.isValid(slotId)) {
      slot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(slotId) });
    } else {
      slot = await db.collection('CoffeeChat').findOne({ id: slotId });
    }

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (!slot.isOpen) {
      return NextResponse.json({ error: 'Slot is closed for signups' }, { status: 400 });
    }

    const signups = slot.signups || [];

    // Check if slot is full
    if (signups.length >= slot.capacity) {
      return NextResponse.json({ error: 'Slot is full' }, { status: 400 });
    }

    // Create the signup with phone number
    const newSignup = {
      id: `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name || null,
      phone: phone.trim(),
      createdAt: new Date(),
    };

    // Add signup to the slot
    await db.collection('CoffeeChat').updateOne(
      { _id: slot._id },
      { 
        $push: { signups: newSignup } as any,
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ 
      ok: true, 
      message: 'Successfully signed up for coffee chat',
      signupId: newSignup.id 
    });
  } catch (error) {
    console.error('Error signing up for coffee chat:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// Remove signup from a slot (UMich email required)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');
    
    if (!slotId) {
      return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Check if slot exists
    let slot;
    if (ObjectId.isValid(slotId)) {
      slot = await db.collection('CoffeeChat').findOne({ _id: new ObjectId(slotId) });
    } else {
      slot = await db.collection('CoffeeChat').findOne({ id: slotId });
    }

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const signups = slot.signups || [];

    // Find the user's signup
    const signupIndex = signups.findIndex((signup: any) => 
      signup.userEmail === session.user.email
    );

    if (signupIndex === -1) {
      return NextResponse.json({ error: 'You are not signed up for this slot' }, { status: 404 });
    }

    // Remove the signup
    signups.splice(signupIndex, 1);

    await db.collection('CoffeeChat').updateOne(
      { _id: slot._id },
      { 
        $set: { 
          signups: signups,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ 
      ok: true, 
      message: 'Successfully removed from coffee chat slot'
    });
  } catch (error) {
    console.error('Error removing signup from coffee chat:', error);
    return NextResponse.json({ error: 'Failed to remove signup' }, { status: 500 });
  } finally {
    await client.close();
  }
}
