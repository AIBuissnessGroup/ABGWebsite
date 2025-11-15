import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient } from 'mongodb';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { recipients, subject, htmlContent, scheduledFor, attachments } = await request.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients array is required' }, { status: 400 });
    }

    if (!subject || !htmlContent || !scheduledFor) {
      return NextResponse.json({ error: 'Subject, HTML content, and scheduled time are required' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const scheduledEmail = {
      recipients,
      subject,
      htmlContent,
      scheduledFor: scheduledDate,
      status: 'pending',
      createdBy: session.user.email,
      createdAt: new Date(),
      attachments: attachments || [],
    };

    const result = await db.collection('scheduledEmails').insertOne(scheduledEmail);

    console.log(`📅 Email scheduled for ${scheduledDate.toLocaleString()}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Recipients: ${recipients.length}`);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      scheduledFor: scheduledDate,
    });
  } catch (error) {
    console.error('Failed to schedule email:', error);
    return NextResponse.json({ error: 'Failed to schedule email' }, { status: 500 });
  }
}
