import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const eventId = id;

    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    const db = client.db();

    // Get partnerships with company data
    const partnerships = await db.collection('EventPartnership').aggregate([
      { $match: { eventId } },
      {
        $lookup: {
          from: 'Company',
          localField: 'companyId',
          foreignField: 'id',
          as: 'company'
        }
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).toArray();

    await client.close();
    return NextResponse.json(partnerships);
  } catch (error) {
    console.error('Error fetching event partnerships:', error);
    return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
  }
} 