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

    // Send one email with all recipients in BCC
    try {
      await sendEmail({
        to: session.user.email, // Send to yourself
        bcc: recipients, // All recipients in BCC
        subject,
        html: htmlContent,
        replyTo: 'ABGcontact@umich.edu',
        attachments: attachments || []
      });
      
      console.log(`✅ Bulk email sent successfully via BCC to ${recipients.length} recipients`);
      
      return NextResponse.json({
        success: true,
        sent: recipients.length,
        failed: 0,
      });
    } catch (error) {
      console.error('❌ Failed to send bulk email:', error);
      return NextResponse.json({
        success: false,
        sent: 0,
        failed: recipients.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }

  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
