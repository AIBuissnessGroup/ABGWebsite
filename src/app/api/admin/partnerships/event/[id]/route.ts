import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const eventId = id;

    const client = new MongoClient(process.env.DATABASE_URL!, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
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