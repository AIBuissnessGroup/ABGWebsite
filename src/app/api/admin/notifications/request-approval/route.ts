import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendSlackDM } from '@/lib/slack';
import { sendEmail } from '@/lib/email';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';

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
    
    // Get all emails for this approver (they might have multiple)
    const approverEmails = approverUser?.emails || [approverEmail];
    const approverSlackEmail = approverUser?.slackEmail || null;
    
    // Store all possible emails for matching later
    const allApproverEmails = Array.from(new Set([approverEmail, ...approverEmails, approverSlackEmail].filter(Boolean)));

    // Generate unique approval ID
    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store approval request in MongoDB
    await db.collection('pendingApprovals').insertOne({
      approvalId,
      approverEmail,
      approverEmails: allApproverEmails,
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

    // Show full message (Slack has ~3000 char limit per block, so split if needed)
    const maxLength = 2800;
    const messageBlocks = [];
    
    if (textContent.length <= maxLength) {
      messageBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Email Preview:*\n\`\`\`\n${textContent}\n\`\`\``
        }
      });
    } else {
      // Split into multiple blocks if message is very long
      const chunks = [];
      for (let i = 0; i < textContent.length; i += maxLength) {
        chunks.push(textContent.substring(i, i + maxLength));
      }
      chunks.forEach((chunk, index) => {
        messageBlocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: index === 0 ? `*Email Preview (Part ${index + 1}/${chunks.length}):*\n\`\`\`\n${chunk}\n\`\`\`` : `\`\`\`\n${chunk}\n\`\`\``
          }
        });
      });
    }

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
        ...messageBlocks,
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

    console.log(`Approval handler called: approvalId=${approvalId}, action=${action}, approverEmail=${approverEmail}`);

    // Connect to MongoDB
    const client = await MongoClient.connect(uri);
    const db = client.db('abg-website');

    // Find the approval request
    const approval = await db.collection('pendingApprovals').findOne({ approvalId, status: 'pending' });
    
    console.log('Found approval:', approval ? 'Yes' : 'No');
    
    if (!approval) {
      await client.close();
      console.error('Approval not found or already processed');
      return NextResponse.json({ error: 'Approval request not found or expired' }, { status: 404 });
    }

    console.log(`Approval request for: ${approval.subject}`);
    console.log(`Approver attempting action: ${approverEmail}`);

    // Look up the user who's trying to approve
    const clickerUser = await db.collection('users').findOne({ 
      email: { $regex: new RegExp(`^${approverEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    console.log('User found in database:', clickerUser ? 'Yes' : 'No');
    if (clickerUser) {
      console.log('User roles:', clickerUser.roles);
    }
    
    // Check if user is an admin
    if (!clickerUser || !clickerUser.roles || 
        (!clickerUser.roles.includes('admin') && !clickerUser.roles.includes('super-admin'))) {
      await client.close();
      console.error('User is not an admin');
      return NextResponse.json({ 
        error: 'Unauthorized - Only admins can approve notifications',
        debug: {
          email: approverEmail,
          foundUser: !!clickerUser,
          roles: clickerUser?.roles || []
        }
      }, { status: 403 });
    }
    
    console.log('User authorized as admin');

    if (action === 'approve') {
      // Execute the approved action
      if (approval.actionType === 'send') {
        // Send email immediately
        try {
          await sendEmail({
            to: approval.requesterEmail,
            bcc: approval.recipients,
            subject: approval.subject,
            html: approval.htmlContent,
            replyTo: 'ABGcontact@umich.edu',
            attachments: approval.attachments || []
          });
          console.log(`✅ Approved email sent to ${approval.recipients.length} recipients`);
        } catch (error) {
          console.error('Failed to send approved email:', error);
          await client.close();
          throw new Error('Failed to send email');
        }
      } else if (approval.actionType === 'schedule') {
        // Schedule email directly in MongoDB
        const scheduledFor = new Date(`${approval.scheduleDate}T${approval.scheduleTime}`);
        
        try {
          const scheduledEmail = {
            recipients: approval.recipients,
            subject: approval.subject,
            htmlContent: approval.htmlContent,
            scheduledFor: scheduledFor,
            status: 'pending',
            createdBy: approval.requesterEmail,
            createdAt: new Date(),
            attachments: approval.attachments || []
          };

          await db.collection('scheduledEmails').insertOne(scheduledEmail);
          console.log(`✅ Email scheduled for ${scheduledFor.toISOString()}`);
        } catch (error) {
          console.error('Failed to schedule email:', error);
          await client.close();
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
      // Save as draft directly in MongoDB
      try {
        const draft = {
          ...approval.draftData,
          createdBy: approval.requesterEmail,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('emailDrafts').insertOne(draft);
        console.log(`✅ Email saved as draft after denial`);
      } catch (error) {
        console.error('Failed to save draft:', error);
        // Continue anyway - the main action is denial
      }

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
