import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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