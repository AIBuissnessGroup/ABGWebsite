import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { sendEmail } from '@/lib/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can send bulk emails
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { recipients, subject, htmlContent, attachments } = await request.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients array is required' }, { status: 400 });
    }

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Subject and HTML content are required' }, { status: 400 });
    }

    console.log(`📧 Sending bulk email to ${recipients.length} recipients`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Sender: ${session.user.email}`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails one by one to track success/failure
    for (const recipientEmail of recipients) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject,
          html: htmlContent,
          replyTo: 'ABGcontact@umich.edu', // Always use ABG contact email as reply-to
          attachments: attachments || []
        });
        sent++;
        console.log(`✓ Sent to ${recipientEmail}`);
      } catch (error) {
        failed++;
        const errorMsg = `Failed to send to ${recipientEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`✗ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`📧 Bulk email complete: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
