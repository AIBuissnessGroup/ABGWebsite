import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, partnerships } = await request.json();

    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    const db = client.db();

    // Delete existing partnerships for this project
    await db.collection('ProjectPartnership').deleteMany({
      projectId
    });

    // Create new partnerships
    if (partnerships && partnerships.length > 0) {
      await db.collection('ProjectPartnership').insertMany(
        partnerships.map((p: any) => ({
          id: `pp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          companyId: p.companyId,
          type: p.type,
          description: p.description || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
    }

    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing project partnerships:', error);
    return NextResponse.json({ error: 'Failed to manage partnerships' }, { status: 500 });
  }
} 
