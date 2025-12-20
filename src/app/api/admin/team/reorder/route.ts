import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { requireAdminSession } from '@/lib/server-admin';

const client = createMongoClient();

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    
    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('TeamMember');
    
    // Update sort order for all team members
    const updatePromises = items.map((item: { id: string; sortOrder: number }) =>
      collection.updateOne(
        { id: item.id },
        { $set: { sortOrder: item.sortOrder } }
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering team members:', error);
    return NextResponse.json({ error: 'Failed to reorder team members' }, { status: 500 });
  } finally {
    await client.close();
  }
} 
