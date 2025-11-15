import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

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
