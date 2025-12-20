import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';

const client = createMongoClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await client.connect();
    const db = client.db();

    const scheduledEmails = await db
      .collection('scheduledEmails')
      .find({})
      .sort({ scheduledFor: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      emails: scheduledEmails.map((email: any) => ({
        id: email._id.toString(),
        subject: email.subject,
        recipients: email.recipients,
        scheduledFor: email.scheduledFor,
        status: email.status,
      }))
    });
  } catch (error) {
    console.error('Failed to fetch scheduled emails:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled emails' }, { status: 500 });
  }
}

// Update scheduled email time
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id, scheduledFor } = await request.json();

    if (!id || !scheduledFor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const result = await db
      .collection('scheduledEmails')
      .updateOne(
        { _id: new ObjectId(id), status: 'pending' },
        { $set: { scheduledFor: new Date(scheduledFor) } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Scheduled email not found or already sent' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update scheduled email:', error);
    return NextResponse.json({ error: 'Failed to update scheduled email' }, { status: 500 });
  }
}

// Delete scheduled email
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing email ID' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const result = await db
      .collection('scheduledEmails')
      .deleteOne({ _id: new ObjectId(id), status: 'pending' });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Scheduled email not found or already sent' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete scheduled email:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled email' }, { status: 500 });
  }
}
