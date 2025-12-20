import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';

const client = createMongoClient();

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
  title?: string;
  description?: string;
  bookedByUserId?: string;
  signup?: InterviewSignup;
};

// GET /api/interviews/slots - Public endpoint with auth
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    // Remove date filtering - return all slots
    // const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    await client.connect();
    const db = client.db();

    // Get all interview slots regardless of date
    const interviewSlots = await db.collection('InterviewSlot').find({}).toArray();

    const transformedSlots = interviewSlots.map((slot: any) => ({
      id: slot.id || slot._id.toString(),
      room: slot.room,
      startTime: slot.startTime instanceof Date ? slot.startTime.toISOString() : slot.startTime,
      endTime: slot.endTime instanceof Date ? slot.endTime.toISOString() : slot.endTime,
      date: slot.date,
      status: slot.status,
      title: slot.title,
      description: slot.description,
      bookedByUserId: slot.bookedByUserId,
      signup: slot.signup ? {
        id: slot.signup.id,
        userEmail: slot.signup.userEmail,
        userName: slot.signup.userName,
        uniqname: slot.signup.uniqname,
        createdAt: slot.signup.createdAt instanceof Date ? slot.signup.createdAt.toISOString() : slot.signup.createdAt,
      } : undefined,
      // Check if current user has this slot booked
      isBookedByCurrentUser: slot.bookedByUserId === session.user.id
    }));

    return NextResponse.json(transformedSlots);
  } catch (error) {
    console.error('Error fetching interview slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// POST /api/interviews/slots - Not implemented (slots are seeded/managed by admin)
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Use admin endpoints to manage slots' }, { status: 405 });
}