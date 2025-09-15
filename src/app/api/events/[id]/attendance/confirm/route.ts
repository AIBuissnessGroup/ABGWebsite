import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

// Create a new client for each request to avoid connection issues
function createMongoClient() {
  return new MongoClient(uri);
}

// Helper function to hash password with salt
function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createMongoClient();
  try {
    const { id: eventId } = await params; // Await params before accessing properties
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Enforce UMich email (defense in depth)
    if (!session.user.email.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'UMich email required' }, { status: 403 });
    }

    const { password } = await request.json();

    await client.connect();
    const db = client.db();

    // Load event and check if attendance confirmation is enabled
    const event = await db.collection('Event').findOne({ id: eventId });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.attendanceConfirmEnabled && !event.registrationEnabled) {
      return NextResponse.json({ error: 'Attendance confirmation not enabled for this event' }, { status: 409 });
    }

    // Check if event has password configuration
    const hasPassword = event.attendancePasswordHash && event.attendancePasswordSalt;
    
    if (hasPassword && !password) {
      return NextResponse.json({ error: 'Password is required for this event' }, { status: 400 });
    }
    
    if (hasPassword) {
      // Verify password if one is configured
      const expectedHash = hashPassword(password, event.attendancePasswordSalt);
      if (expectedHash !== event.attendancePasswordHash) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
      }
    } else if (password) {
      // If no password is configured but user provided one, that's an error
      return NextResponse.json({ error: 'No password required for this event' }, { status: 400 });
    }

    // Get or create user record
    let user = await db.collection('User').findOne({ email: session.user.email });
    let userId: string;
    
    if (!user) {
      const newUser = {
        id: crypto.randomUUID(),
        email: session.user.email,
        name: session.user.name || '',
        image: session.user.image || null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('User').insertOne(newUser);
      userId = newUser.id;
    } else {
      userId = user.id;
    }

    const confirmedAt = new Date();

    // Upsert attendance record
    await db.collection('EventAttendance').updateOne(
      { eventId: eventId, email: session.user.email },
      {
        $set: {
          eventId: eventId,
          userId,
          email: session.user.email,
          name: session.user.name || '',
          confirmedAt,
          source: 'user'
        },
        $setOnInsert: {
          id: crypto.randomUUID()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      attended: true,
      confirmedAt: confirmedAt.toISOString()
    });
  } catch (error) {
    console.error('Error confirming attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createMongoClient();
  try {
    const { id: eventId } = await params; // Await params before accessing properties
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await client.connect();
    const db = client.db();

    const attendance = await db.collection('EventAttendance').findOne({
      eventId: eventId,
      email: session.user.email
    });

    return NextResponse.json({
      attended: !!attendance,
      confirmedAt: attendance?.confirmedAt?.toISOString()
    });
  } catch (error) {
    console.error('Error checking attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}
