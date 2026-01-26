/**
 * Phase Cutoffs API
 * POST - Apply cutoff to advance/reject applicants
 * GET - Get cutoff info for a phase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  applyCutoff,
  finalizePhase,
  getPhaseConfig,
  getPhaseDecisions,
  getPhaseCompleteness,
  getApplicationById,
  logEmailSent,
} from '@/lib/recruitment/db';
import { sendEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';
import type { 
  ReviewPhase, 
  CutoffCriteria,
  ApplicationStage,
  ApplicationTrack,
} from '@/types/recruitment';

// MongoDB connection options
const connectionString = process.env.DATABASE_URL || '';
const hasTlsInConnectionString = /[?&](tls|ssl)=/.test(connectionString);
const isProduction = process.env.NODE_ENV === 'production';

const mongoOptions: MongoClientOptions = hasTlsInConnectionString
  ? (isProduction 
      ? { tlsCAFile: '/app/global-bundle.pem' }
      : { tlsAllowInvalidCertificates: true })
  : {
      tls: isProduction,
      tlsCAFile: isProduction ? '/app/global-bundle.pem' : undefined,
    };

// Helper to get all admin emails from the database
async function getAllAdminEmails(): Promise<string[]> {
  const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get all users with ADMIN role
    const adminUsers = await db.collection('users').find({
      roles: { $in: ['ADMIN', 'PRESIDENT', 'VP_INTERNAL', 'VP_EXTERNAL', 'VP_TECH', 'VP_MARKETING', 'VP_FINANCE'] }
    }).toArray();
    
    return adminUsers.map(u => u.email).filter(Boolean);
  } finally {
    await client.close();
  }
}

// CORS helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const phase = searchParams.get('phase') as ReviewPhase | null;

    if (!cycleId || !phase) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId and phase are required' }, { status: 400 })
      );
    }

    const phaseConfig = await getPhaseConfig(cycleId, phase);
    const decisions = await getPhaseDecisions(cycleId, phase);
    const completeness = await getPhaseCompleteness(cycleId, phase);

    return corsResponse(NextResponse.json({
      phaseConfig,
      decisions,
      completeness,
      cutoffApplied: !!phaseConfig?.cutoffAppliedAt,
    }));
  } catch (error) {
    console.error('Error fetching cutoff info:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch cutoff info' }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const body = await request.json();
    const { 
      cycleId, 
      phase, 
      track,  // Optional: filter by specific track
      cutoffCriteria, 
      manualOverrides = [], 
      sendEmails = false,
      finalizeAfter = true,
      forceFinalize = false, // Allow bypassing admin completion check
    } = body;

    if (!cycleId || !phase || !cutoffCriteria) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId, phase, and cutoffCriteria are required' }, { status: 400 })
      );
    }

    // Validate phase
    const validPhases: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];
    if (!validPhases.includes(phase)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
      );
    }

    // Check if phase is already finalized
    const phaseConfig = await getPhaseConfig(cycleId, phase);
    if (phaseConfig?.status === 'finalized') {
      return corsResponse(
        NextResponse.json({ error: 'Phase is already finalized' }, { status: 400 })
      );
    }

    // Validate cutoff criteria
    const validTypes: CutoffCriteria['type'][] = ['top_n', 'min_score', 'manual'];
    if (!validTypes.includes(cutoffCriteria.type)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid cutoff criteria type' }, { status: 400 })
      );
    }

    const adminEmail = session.user.email;

    // Apply cutoff (filtered by track if specified)
    const result = await applyCutoff(
      cycleId,
      phase,
      cutoffCriteria,
      manualOverrides,
      adminEmail,
      track  // Pass track filter
    );

    // Finalize phase if requested
    if (finalizeAfter) {
      // Validate all admins have reviewed all applicants before allowing finalization
      const completeness = await getPhaseCompleteness(cycleId, phase);
      const allAdminEmails = await getAllAdminEmails();
      
      // Check each admin has reviewed every applicant
      const incompleteAdmins: { email: string; reviewed: number; total: number }[] = [];
      
      for (const adminEmailToCheck of allAdminEmails) {
        const reviewerStats = completeness.reviewerCompletion.find(r => r.email === adminEmailToCheck);
        const reviewed = reviewerStats?.reviewed || 0;
        const total = completeness.totalApplicants;
        
        if (reviewed < total) {
          incompleteAdmins.push({
            email: adminEmailToCheck,
            reviewed,
            total,
          });
        }
      }
      
      if (incompleteAdmins.length > 0 && !forceFinalize) {
        return corsResponse(
          NextResponse.json({ 
            error: 'Cannot finalize: Not all admins have reviewed all applicants',
            incompleteAdmins,
            message: `${incompleteAdmins.length} admin(s) have not completed their reviews. All ${allAdminEmails.length} admins must review all ${completeness.totalApplicants} applicants before finalizing. Use forceFinalize to override.`,
          }, { status: 400 })
        );
      }
      
      await finalizePhase(cycleId, phase, adminEmail);
    }

    // Send emails if requested
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailErrors: string[] = [];

    if (sendEmails) {
      // Determine email templates based on phase and action
      const emailTemplates = getEmailTemplates(phase);

      // Send advancement emails
      for (const appId of result.advanced) {
        try {
          const app = await getApplicationById(appId);
          if (!app) continue;

          const email = (app.answers?.email as string) || app.userId;
          const name = (app.answers?.name as string) || (app.answers?.fullName as string) || 'Applicant';

          if (!email) continue;

          await sendEmail({
            to: email,
            subject: emailTemplates.advance.subject.replace('{{name}}', name),
            html: emailTemplates.advance.body
              .replace(/\{\{name\}\}/g, name)
              .replace(/\{\{track\}\}/g, app.track),
          });

          await logEmailSent({
            cycleId,
            applicationId: appId,
            recipientEmail: email,
            subject: emailTemplates.advance.subject,
            templateId: `${phase}_advance`,
            status: 'sent',
            sentAt: new Date().toISOString(),
            sentBy: adminEmail,
          });

          emailsSent++;
        } catch (error) {
          emailsFailed++;
          emailErrors.push(`Failed to send advance email for ${appId}`);
        }
      }

      // Send rejection emails
      for (const appId of result.rejected) {
        try {
          const app = await getApplicationById(appId);
          if (!app) continue;

          const email = (app.answers?.email as string) || app.userId;
          const name = (app.answers?.name as string) || (app.answers?.fullName as string) || 'Applicant';

          if (!email) continue;

          await sendEmail({
            to: email,
            subject: emailTemplates.reject.subject.replace('{{name}}', name),
            html: emailTemplates.reject.body
              .replace(/\{\{name\}\}/g, name)
              .replace(/\{\{track\}\}/g, app.track),
          });

          await logEmailSent({
            cycleId,
            applicationId: appId,
            recipientEmail: email,
            subject: emailTemplates.reject.subject,
            templateId: `${phase}_reject`,
            status: 'sent',
            sentAt: new Date().toISOString(),
            sentBy: adminEmail,
          });

          emailsSent++;
        } catch (error) {
          emailsFailed++;
          emailErrors.push(`Failed to send reject email for ${appId}`);
        }
      }
    }

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      adminEmail,
      'content.updated',
      'RecruitmentPhaseCutoff',
      {
        targetId: cycleId,
        meta: {
          phase,
          cutoffCriteria,
          advanced: result.advanced.length,
          rejected: result.rejected.length,
          emailsSent,
          emailsFailed,
        },
      }
    );

    return corsResponse(NextResponse.json({
      success: true,
      advanced: result.advanced,
      rejected: result.rejected,
      emailsSent,
      emailsFailed,
      errors: emailErrors.length > 0 ? emailErrors : undefined,
    }));
  } catch (error) {
    console.error('Error applying cutoff:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to apply cutoff' }, { status: 500 })
    );
  }
}

// Email templates for each phase
function getEmailTemplates(phase: ReviewPhase): {
  advance: { subject: string; body: string };
  reject: { subject: string; body: string };
} {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  `;
  const footerStyle = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
      <p>Best regards,<br>The ABG Recruitment Team</p>
      <p style="font-size: 12px; color: #999;">AI Business Group - University of Michigan</p>
    </div>
  `;

  switch (phase) {
    case 'application':
      return {
        advance: {
          subject: 'ABG Application Update - Interview Invitation',
          body: `${baseStyle}
            <h2 style="color: #00274c;">Congratulations, {{name}}! 🎉</h2>
            <p>We are pleased to inform you that your application to the AI Business Group has been selected to move forward to the interview stage!</p>
            <p>Your application stood out among many impressive candidates, and we're excited to learn more about you in person.</p>
            <h3 style="color: #00274c;">Next Steps:</h3>
            <ol>
              <li>Log in to the <a href="https://abgumich.org/portal">ABG Portal</a></li>
              <li>Navigate to the Schedule section</li>
              <li>Book your Round 1 (Technical) interview slot</li>
            </ol>
            <p>Please schedule your interview within the next few days. If you have any questions, feel free to reach out.</p>
            ${footerStyle}
          </div>`,
        },
        reject: {
          subject: 'ABG Application Update',
          body: `${baseStyle}
            <h2 style="color: #00274c;">Thank You for Applying, {{name}}</h2>
            <p>Thank you for your interest in the AI Business Group and for taking the time to apply.</p>
            <p>After careful review, we regret to inform you that we are unable to move forward with your application at this time. This decision was difficult given the high caliber of applicants we received.</p>
            <p style="color: #666; font-style: italic;">Please note that due to the high volume of applications, we are unable to provide individual feedback.</p>
            <p>We encourage you to:</p>
            <ul>
              <li>Attend our open events throughout the semester</li>
              <li>Consider becoming a general member</li>
              <li>Apply again in future recruitment cycles</li>
            </ul>
            <p>Thank you again for your interest in ABG. We wish you the best in your future endeavors!</p>
            ${footerStyle}
          </div>`,
        },
      };
    
    case 'interview_round1':
      return {
        advance: {
          subject: 'ABG Interview Update - Round 2 Invitation',
          body: `${baseStyle}
            <h2 style="color: #00274c;">Great News, {{name}}! 🎉</h2>
            <p>Congratulations! You have successfully advanced to Round 2 of the ABG interview process.</p>
            <p>Your performance in the technical interview impressed our team, and we're excited to continue getting to know you.</p>
            <h3 style="color: #00274c;">Next Steps:</h3>
            <ol>
              <li>Log in to the <a href="https://abgumich.org/portal">ABG Portal</a></li>
              <li>Navigate to the Schedule section</li>
              <li>Book your Round 2 (Behavioral) interview slot</li>
            </ol>
            <p>Round 2 will focus on cultural fit, leadership, and teamwork. Be prepared to share examples from your experiences.</p>
            ${footerStyle}
          </div>`,
        },
        reject: {
          subject: 'ABG Interview Update',
          body: `${baseStyle}
            <h2 style="color: #00274c;">Thank You, {{name}}</h2>
            <p>Thank you for participating in the Round 1 interview with the AI Business Group.</p>
            <p>After careful consideration, we have decided not to move forward with your application at this time. This was a difficult decision given the strong pool of candidates.</p>
            <p style="color: #666; font-style: italic;">Please note that due to the high volume of applicants, we are unable to provide individual feedback.</p>
            <p>We appreciate the time you invested in the interview process and encourage you to:</p>
            <ul>
              <li>Attend our open events and workshops</li>
              <li>Join as a general member</li>
              <li>Apply again next semester</li>
            </ul>
            <p>We hope to see you at our events throughout the semester!</p>
            ${footerStyle}
          </div>`,
        },
      };
    
    case 'interview_round2':
      return {
        advance: {
          subject: 'Welcome to ABG! 🎊',
          body: `${baseStyle}
            <h2 style="color: #00274c;">Congratulations, {{name}}! 🎉</h2>
            <p><strong>You have been accepted into the AI Business Group!</strong></p>
            <p>After a thorough review process, we are thrilled to welcome you as a new member of ABG. Your skills, passion, and personality impressed us throughout the recruitment process.</p>
            <h3 style="color: #00274c;">What's Next:</h3>
            <ol>
              <li>Look out for our onboarding email with details about orientation</li>
              <li>Join our Slack workspace (link will be sent separately)</li>
              <li>Mark your calendar for our welcome event</li>
            </ol>
            <p>We're excited to have you join our community and can't wait to see what you'll accomplish with ABG!</p>
            ${footerStyle}
          </div>`,
        },
        reject: {
          subject: 'ABG Final Decision',
          body: `${baseStyle}
            <h2 style="color: #00274c;">Thank You, {{name}}</h2>
            <p>Thank you for your dedication throughout the ABG recruitment process. We appreciate the time and effort you put into each stage.</p>
            <p>After careful deliberation, we have decided not to extend a membership offer at this time. This was an incredibly difficult decision given the strength of your application and interviews.</p>
            <p style="color: #666; font-style: italic;">Please note that due to the volume of applicants, we are unable to provide individual feedback.</p>
            <p>We strongly encourage you to:</p>
            <ul>
              <li>Join as a general member to stay connected</li>
              <li>Attend our open events and workshops</li>
              <li>Apply again in future semesters</li>
            </ul>
            <p>Your passion and skills are evident, and we hope to see you apply again. Thank you for your interest in ABG!</p>
            ${footerStyle}
          </div>`,
        },
      };
    
    default:
      return {
        advance: { subject: 'ABG Update', body: 'You have been advanced to the next stage.' },
        reject: { subject: 'ABG Update', body: 'Thank you for your application.' },
      };
  }
}
