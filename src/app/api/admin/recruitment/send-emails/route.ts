import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getApplicationsByCycle, 
  logEmailSent,
} from '@/lib/recruitment/db';
import { sendEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

// CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// POST /api/admin/recruitment/send-emails - Send bulk emails
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { cycleId, recipientIds, subject, body: emailBody, templateId } = body;

    if (!cycleId || !recipientIds?.length || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Get applications for the recipients
    const applications = await getApplicationsByCycle(cycleId);
    const targetApps = applications.filter(app => recipientIds.includes(app._id));

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails
    for (const app of targetApps) {
      // Get email from answers if available
      const userEmail = (app.answers?.email as string) || app.userId;
      const userName = (app.answers?.name as string) || 
                       (app.answers?.fullName as string) || 
                       'Applicant';
      
      if (!userEmail) {
        results.failed++;
        results.errors.push(`No email for application ${app._id}`);
        continue;
      }

      try {
        // Replace template variables
        const personalizedBody = emailBody
          .replace(/\{\{name\}\}/g, userName)
          .replace(/\{\{email\}\}/g, userEmail)
          .replace(/\{\{track\}\}/g, app.track)
          .replace(/\{\{stage\}\}/g, app.stage);

        const personalizedSubject = subject
          .replace(/\{\{name\}\}/g, userName);

        // Send the email
        await sendEmail({
          to: userEmail,
          subject: personalizedSubject,
          text: personalizedBody,
          html: personalizedBody.replace(/\n/g, '<br>'),
        });

        // Log the email
        await logEmailSent({
          cycleId,
          applicationId: app._id,
          recipientEmail: userEmail,
          subject: personalizedSubject,
          templateId,
          status: 'sent',
          sentAt: new Date().toISOString(),
          sentBy: session.user.email,
        });

        results.sent++;
      } catch (error) {
        console.error(`Failed to send email to ${userEmail}:`, error);
        
        // Log the failure
        await logEmailSent({
          cycleId,
          applicationId: app._id,
          recipientEmail: userEmail,
          subject,
          templateId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentBy: session.user.email,
        });

        results.failed++;
        results.errors.push(`Failed to send to ${userEmail}`);
      }
    }

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.updated',
      'RecruitmentEmail',
      {
        targetId: cycleId,
        meta: {
          action: 'emails_sent',
          templateId,
          recipientCount: recipientIds.length,
          sent: results.sent,
          failed: results.failed,
        },
      }
    );

    return NextResponse.json(results, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
