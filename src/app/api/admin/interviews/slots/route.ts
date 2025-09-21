import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

type InterviewSignup = {
  id: string;
  userEmail: string;
  userName: string | null;
  uniqname: string;
  createdAt: string;
};

type InterviewSlot = {
  id: string;
  room: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  date: string;      // YYYY-MM-DD
  status: 'available' | 'booked';
  bookedByUserId?: string;
  signup?: InterviewSignup;
};

// GET /api/admin/interviews/slots - Admin view of all slots
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    await client.connect();
    const db = client.db();

    const interviewSlots = await db.collection('InterviewSlot').find({
      date: date
    }).sort({ room: 1, startTime: 1 }).toArray();

    const transformedSlots = interviewSlots.map((slot: any) => ({
      id: slot.id || slot._id.toString(),
      room: slot.room,
      startTime: slot.startTime instanceof Date ? slot.startTime.toISOString() : slot.startTime,
      endTime: slot.endTime instanceof Date ? slot.endTime.toISOString() : slot.endTime,
      date: slot.date,
      status: slot.status,
      bookedByUserId: slot.bookedByUserId,
      signup: slot.signup ? {
        id: slot.signup.id,
        userEmail: slot.signup.userEmail,
        userName: slot.signup.userName,
        uniqname: slot.signup.uniqname,
        createdAt: slot.signup.createdAt instanceof Date ? slot.signup.createdAt.toISOString() : slot.signup.createdAt,
      } : undefined,
    }));

    return NextResponse.json(transformedSlots);
  } catch (error) {
    console.error('Error fetching interview slots for admin:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// POST /api/admin/interviews/slots - Create interview slots (bulk seed)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, timezone = 'America/Detroit', rooms, times } = body;

    if (!date || !rooms || !times) {
      return NextResponse.json({ error: 'Missing required fields: date, rooms, times' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const slotsToCreate = [];

    // Create slots for each room and time combination
    for (const room of rooms) {
      for (const [startHour, endHour] of times) {
        const startTime = new Date(`${date}T${startHour}:00.000-04:00`); // Eastern Time
        const endTime = new Date(`${date}T${endHour}:00.000-04:00`);

        const slotData = {
          id: `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          room: room,
          startTime: startTime,
          endTime: endTime,
          date: date,
          status: 'available',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: session.user.email,
        };

        slotsToCreate.push(slotData);
      }
    }

    // Insert all slots
    const result = await db.collection('InterviewSlot').insertMany(slotsToCreate);

    return NextResponse.json({
      success: true,
      message: `Created ${result.insertedCount} interview slots`,
      slotsCreated: result.insertedCount
    });

  } catch (error) {
    console.error('Error creating interview slots:', error);
    return NextResponse.json({ error: 'Failed to create slots' }, { status: 500 });
  } finally {
    await client.close();
  }
}