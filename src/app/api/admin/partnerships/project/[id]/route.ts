import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { requireAdminSession } from '@/lib/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = id;

    const client = createMongoClient();
    await client.connect();
    const db = client.db();

    // Get partnerships with company data
    const partnerships = await db.collection('ProjectPartnership').aggregate([
      { $match: { projectId } },
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
    console.error('Error fetching project partnerships:', error);
    return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
  }
} 
