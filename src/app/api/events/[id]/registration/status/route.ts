import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

// Create a new client for each request to avoid connection issues
function createMongoClient() {
  return new MongoClient(uri);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = createMongoClient();
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ registered: false });
    }

    await client.connect();
    const db = client.db();
    
    // Check if user is registered for this event
    const registration = await db.collection('EventAttendance').findOne({
      eventId: id,
      $or: [
        { email: session.user.email },
        { 'attendee.umichEmail': session.user.email }
      ]
    });
    
    if (registration) {
      return NextResponse.json({
        registered: true,
        status: registration.status || 'confirmed',
        registeredAt: registration.confirmedAt || registration.registeredAt,
        waitlistPosition: registration.waitlistPosition
      });
    }
    
    return NextResponse.json({ registered: false });
  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json({ registered: false });
  } finally {
    await client.close();
  }
}