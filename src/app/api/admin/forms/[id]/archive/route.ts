import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await request.json();

    if (!['archive', 'unarchive'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "archive" or "unarchive"' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();
    const formsCollection = db.collection('Form');

    // Check if form exists
    const form = await formsCollection.findOne({ id: formId });
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Update form archive status
    const isArchived = action === 'archive';
    const updateData: any = {
      isArchived: isArchived ? 1 : 0,
      archivedAt: isArchived ? Date.now() : null,
      archivedBy: isArchived ? session.user.email : null,
      updatedAt: Date.now()
    };

    // If archiving, also set as inactive
    if (isArchived) {
      updateData.isActive = 0;
    }

    await formsCollection.updateOne(
      { id: formId },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: `Form ${action}d successfully`,
      isArchived
    });

  } catch (error) {
    console.error('Error archiving/unarchiving form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}