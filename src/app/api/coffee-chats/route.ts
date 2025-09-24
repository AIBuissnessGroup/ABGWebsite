import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

// Enhanced GET with filtering
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  
  // Extract filter parameters
  const day = searchParams.get('day');
  const execId = searchParams.get('execId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const location = searchParams.get('location');
  const mySlot = searchParams.get('mySlot') === 'true';

  try {
    await client.connect();
    const db = client.db();

    // Build filter query
    const filter: any = {};
    
    if (day) {
      const dayStart = new Date(day + 'T00:00:00.000Z');
      const dayEnd = new Date(day + 'T23:59:59.999Z');
      filter.startTime = { $gte: dayStart, $lte: dayEnd };
    }
    
    if (execId) {
      filter.execMemberId = execId;
    }
    
    if (startTime || endTime) {
      filter.startTime = filter.startTime || {};
      if (startTime) {
        const startDateTime = new Date();
        const [hour, minute] = startTime.split(':').map(Number);
        startDateTime.setHours(hour, minute, 0, 0);
        filter.startTime.$gte = startDateTime;
      }
      if (endTime) {
        const endDateTime = new Date();
        const [hour, minute] = endTime.split(':').map(Number);
        endDateTime.setHours(hour, minute, 0, 0);
        filter.startTime.$lte = endDateTime;
      }
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    let slots = await db.collection('CoffeeChat')
      .find(filter)
      .sort({ startTime: 1 })
      .toArray();

    // Filter for user's slot if requested
    if (mySlot && session?.user?.email) {
      slots = slots.filter((slot: any) => 
        slot.signups?.some((signup: any) => signup.userEmail === session.user.email)
      );
    }

    // Check if user is admin to determine phone visibility
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

    // Get team members for exec info
    const teamMembers = await db.collection('TeamMember').find({ active: true }).toArray();
    const teamMemberMap = new Map(teamMembers.map(member => [member.id, member]));

    // Transform the data
    const transformedSlots = slots.map((slot: any) => {
      const execMember = slot.execMemberId ? teamMemberMap.get(slot.execMemberId) : null;
      
      return {
        id: slot.id || slot._id.toString(),
        title: slot.title,
        startTime: slot.startTime instanceof Date ? slot.startTime.toISOString() : slot.startTime,
        endTime: slot.endTime instanceof Date ? slot.endTime.toISOString() : slot.endTime,
        location: slot.location,
        hostName: slot.hostName || execMember?.name || '',
        hostEmail: slot.hostEmail || execMember?.email || '',
        capacity: slot.capacity,
        isOpen: slot.isOpen,
        execMember: execMember ? {
          id: execMember.id,
          name: execMember.name,
          role: execMember.role,
          email: isAdmin ? execMember.email : undefined,
        } : null,
        signups: (slot.signups || []).map((signup: any) => ({
          id: signup.id,
          userEmail: signup.userEmail,
          userName: signup.userName,
          phone: isAdmin ? signup.phone : undefined, // Only show phone to admins
          createdAt: signup.createdAt instanceof Date ? signup.createdAt.toISOString() : signup.createdAt,
        })),
        signupCount: (slot.signups || []).length,
        userSignedUp: session?.user?.email ? 
          (slot.signups || []).some((signup: any) => signup.userEmail === session.user.email) : false,
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

// Enhanced signup with phone number requirement
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slotId, phone } = body;
    
    if (!slotId) {
      return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
    }
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Check if user is already signed up for any slot (non-admins only)
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isAdmin) {
      const existingSignup = await db.collection('CoffeeChat').findOne({
        'signups.userEmail': session.user.email
      });

      if (existingSignup) {
        return NextResponse.json({ 
          error: 'You are already signed up for a coffee chat. Please unsign from your current slot before signing up for a new one.' 
        }, { status: 409 });
      }
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

    // Check if user is already signed up for this specific slot
    const existingSignup = signups.find((signup: any) => 
      signup.userEmail === session.user.email
    );

    if (existingSignup) {
      return NextResponse.json({ error: 'You are already signed up for this slot' }, { status: 400 });
    }

    // Check if slot is full
    if (signups.length >= slot.capacity) {
      return NextResponse.json({ error: 'Slot is full' }, { status: 400 });
    }

    // Create the signup
    const newSignup = {
      id: `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name || null,
      phone: phone,
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
      success: true, 
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

// Remove signup from a slot
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
      success: true, 
      message: 'Successfully removed from coffee chat slot'
    });
  } catch (error) {
    console.error('Error removing signup from coffee chat:', error);
    return NextResponse.json({ error: 'Failed to remove signup' }, { status: 500 });
  } finally {
    await client.close();
  }
}
