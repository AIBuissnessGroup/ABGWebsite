import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { eventId, partnerships } = await request.json();

    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    const db = client.db();

    // Delete existing partnerships for this event
    await db.collection('EventPartnership').deleteMany({
      eventId
    });

    // Create new partnerships
    if (partnerships && partnerships.length > 0) {
      await db.collection('EventPartnership').insertMany(
        partnerships.map((p: any) => ({
          id: `ep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          eventId,
          companyId: p.companyId,
          type: p.type,
          description: p.description || '',
          sponsorshipLevel: p.sponsorshipLevel || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
    }

    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing event partnerships:', error);
    return NextResponse.json({ error: 'Failed to manage partnerships' }, { status: 500 });
  }
} 