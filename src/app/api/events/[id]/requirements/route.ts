import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

function createMongoClient() {
  return new MongoClient(uri);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createMongoClient();
  try {
    const { id: eventId } = await params;
    
    await client.connect();
    const db = client.db();

    const event = await db.collection('Event').findOne({ id: eventId });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      attendanceConfirmEnabled: !!event.attendanceConfirmEnabled,
      registrationEnabled: !!event.registrationEnabled,
      requiresPassword: !!(event.attendancePasswordHash && event.attendancePasswordSalt)
    });
  } catch (error) {
    console.error('Error checking event requirements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}