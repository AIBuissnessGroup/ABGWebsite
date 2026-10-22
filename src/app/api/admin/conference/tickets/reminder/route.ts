import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { sendEmail } from '@/lib/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'POST, OPTIONS',
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

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { to, bcc, subject, htmlContent, replyTo } = await request.json();

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: 'A valid primary "To" email address is required (e.g. ABGcontact@umich.edu)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(bcc) || bcc.length === 0) {
      return NextResponse.json({ error: 'Please select at least one ticket holder in BCC' }, { status: 400 });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Email subject is required' }, { status: 400 });
    }

    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
      return NextResponse.json({ error: 'Email HTML content is required' }, { status: 400 });
    }

    // Clean, validate, and deduplicate BCC list
    const validBcc = Array.from(
      new Set(
        bcc
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter((e) => e.length > 3 && e.includes('@'))
      )
    );

    if (validBcc.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipient email addresses found in the selected BCC list' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending conference reminder email:`);
    console.log(`   To: ${to}`);
    console.log(`   BCC Count: ${validBcc.length}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Admin: ${session.user.email}`);

    // Chunk into batches of up to 80 BCC recipients to stay safely within Gmail single-message limits
    const BATCH_SIZE = 80;
    const batches: string[][] = [];
    for (let i = 0; i < validBcc.length; i += BATCH_SIZE) {
      batches.push(validBcc.slice(i, i + BATCH_SIZE));
    }

    let sentBatches = 0;
    const errors: string[] = [];

    for (let b = 0; b < batches.length; b++) {
      const batchRecipients = batches[b];
      try {
        const success = await sendEmail({
          to: to.trim(),
          bcc: batchRecipients,
          subject: subject.trim(),
          html: htmlContent,
          replyTo: replyTo?.trim() || 'ABGcontact@umich.edu',
        });

        if (!success) {
          throw new Error(`Gmail API returned failure on batch ${b + 1}`);
        }
        sentBatches++;
      } catch (err: any) {
        console.error(`❌ Batch ${b + 1} failed:`, err);
        errors.push(err.message || `Batch ${b + 1} failed`);
      }
    }

    if (sentBatches === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send reminder email. Please check server Gmail token configuration.',
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentCount: validBcc.length,
      batchesSent: sentBatches,
      totalBatches: batches.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error sending conference reminder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
