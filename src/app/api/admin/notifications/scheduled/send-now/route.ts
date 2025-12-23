import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient, ObjectId } from 'mongodb';
import { sendEmail } from '@/lib/email';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing email ID' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Get the scheduled email
    const scheduledEmail = await db
      .collection('scheduledEmails')
      .findOne({ _id: new ObjectId(id), status: 'pending' });

    if (!scheduledEmail) {
      return NextResponse.json({ error: 'Scheduled email not found or already sent' }, { status: 404 });
    }

    // Send emails to all recipients
    let sent = 0;
    let failed = 0;

    for (const recipient of scheduledEmail.recipients) {
      try {
        await sendEmail({
          to: recipient,
          subject: scheduledEmail.subject,
          html: scheduledEmail.htmlContent,
          attachments: scheduledEmail.attachments || []
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error);
        failed++;
      }
    }

    // Update status to sent
    await db
      .collection('scheduledEmails')
      .updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: 'sent',
            sentAt: new Date(),
            sentCount: sent,
            failedCount: failed
          } 
        }
      );

    return NextResponse.json({ 
      success: true,
      sent,
      failed
    });

  } catch (error) {
    console.error('Failed to send scheduled email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
