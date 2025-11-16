import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendSlackDM } from '@/lib/slack';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      approverEmail,
      requesterEmail,
      requesterName,
      recipients,
      subject,
      htmlContent,
      attachments,
      actionType,
      scheduleDate,
      scheduleTime,
      draftData
    } = await req.json();

    if (!approverEmail || approverEmail === requesterEmail) {
      return NextResponse.json({ error: 'Invalid approver selection' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(uri);
    const db = client.db('abg-website');

    // Get approver name from users collection
    const approverUser = await db.collection('users').findOne({ email: approverEmail });
    const approverName = approverUser?.name || approverEmail;

    // Generate unique approval ID
    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store approval request in MongoDB
    await db.collection('pendingApprovals').insertOne({
      approvalId,
      approverEmail,
      approverName,
      requesterEmail,
      requesterName,
      recipients,
      subject,
      htmlContent,
      attachments,
      actionType,
      scheduleDate,
      scheduleTime,
      draftData,
      status: 'pending',
      createdAt: new Date()
    });

    await client.close();

    // Format HTML for Slack (convert to plain text with structure)
    const tempDiv = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    const textContent = tempDiv
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    const previewText = textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent;

    // Send Slack message with interactive buttons
    const slackMessage = {
      text: `📧 *Notification Approval Request*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📧 Notification Approval Request'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*From:* ${requesterName} (${requesterEmail})\n*Action:* ${actionType === 'send' ? 'Send immediately' : `Schedule for ${scheduleDate} ${scheduleTime}`}\n*Subject:* ${subject}\n*Recipients:* ${recipients.length} recipient(s)`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Email Preview:*\n\`\`\`\n${previewText}\n\`\`\``
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Attachments:* ${attachments.length > 0 ? attachments.map((a: any) => a.name).join(', ') : 'None'}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Approve'
              },
              style: 'primary',
              value: approvalId,
              action_id: `approve_${approvalId}`
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ Deny'
              },
              style: 'danger',
              value: approvalId,
              action_id: `deny_${approvalId}`
            }
          ]
        }
      ]
    };

    // Send to approver
    await sendSlackDM(approverEmail, slackMessage);

    return NextResponse.json({ 
      success: true, 
      message: 'Approval request sent',
      approvalId 
    });

  } catch (error) {
    console.error('Request approval error:', error);
    return NextResponse.json(
      { error: 'Failed to request approval' },
      { status: 500 }
    );
  }
}

// Handle approval/denial responses
export async function PUT(req: NextRequest) {
  try {
    const { approvalId, action, approverEmail } = await req.json();

    // Connect to MongoDB
    const client = await MongoClient.connect(uri);
    const db = client.db('abg-website');

    // Find the approval request
    const approval = await db.collection('pendingApprovals').findOne({ approvalId, status: 'pending' });
    
    if (!approval) {
      await client.close();
      return NextResponse.json({ error: 'Approval request not found or expired' }, { status: 404 });
    }

    if (approval.approverEmail !== approverEmail) {
      await client.close();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'approve') {
      // Execute the approved action
      if (approval.actionType === 'send') {
        // Send email immediately
        const sendResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: approval.recipients,
            subject: approval.subject,
            htmlContent: approval.htmlContent,
            attachments: approval.attachments
          })
        });

        if (!sendResponse.ok) {
          throw new Error('Failed to send email');
        }
      } else if (approval.actionType === 'schedule') {
        // Schedule email
        const scheduledFor = new Date(`${approval.scheduleDate}T${approval.scheduleTime}`);
        const scheduleResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notifications/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: approval.recipients,
            subject: approval.subject,
            htmlContent: approval.htmlContent,
            scheduledFor: scheduledFor.toISOString(),
            attachments: approval.attachments
          })
        });

        if (!scheduleResponse.ok) {
          throw new Error('Failed to schedule email');
        }
      }

      // Notify requester of approval
      await sendSlackDM(approval.requesterEmail, {
        text: `✅ Your notification "${approval.subject}" has been approved and ${approval.actionType === 'send' ? 'sent' : 'scheduled'}!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Notification Approved*\n\nYour notification "${approval.subject}" has been approved by ${approverEmail} and ${approval.actionType === 'send' ? 'sent successfully' : `scheduled for ${approval.scheduleDate} ${approval.scheduleTime}`}!`
            }
          }
        ]
      });

    } else if (action === 'deny') {
      // Save as draft
      const draftResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notifications/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approval.draftData)
      });

      // Notify requester of denial
      await sendSlackDM(approval.requesterEmail, {
        text: `❌ Your notification "${approval.subject}" was not approved`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `❌ *Notification Denied*\n\nYour notification "${approval.subject}" was not approved by ${approverEmail}.\n\nDon't worry! It has been saved as a draft so you can make changes and resubmit.`
            }
          }
        ]
      });
    }

    // Update status in MongoDB
    await db.collection('pendingApprovals').updateOne(
      { approvalId },
      { 
        $set: { 
          status: action === 'approve' ? 'approved' : 'denied',
          processedAt: new Date()
        } 
      }
    );

    await client.close();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Approval action error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval action' },
      { status: 500 }
    );
  }
}
