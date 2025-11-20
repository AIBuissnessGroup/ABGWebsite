import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendEmail } from '@/lib/email';
import { sendSlackDM } from '@/lib/slack';

const uri = process.env.MONGODB_URI!;

/**
 * Slack Interactivity Webhook Handler
 * Handles button clicks and other interactive elements from Slack messages
 * 
 * Configure this URL in Slack App Settings > Interactivity & Shortcuts:
 * https://yourdomain.com/api/slack/interactivity
 */

export async function POST(req: NextRequest) {
  try {
    console.log('Slack interactivity webhook called');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    const body = await req.text();
    console.log('Body length:', body.length);
    
    const params = new URLSearchParams(body);
    const payloadStr = params.get('payload');
    
    if (!payloadStr) {
      console.error('No payload in request');
      return NextResponse.json({ error: 'No payload' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    
    console.log('Slack interactivity payload:', JSON.stringify(payload, null, 2));
    
    // Handle button actions
    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      const actionId = action.action_id;
      const approvalId = action.value;
      
      // Determine if approve or deny
      const isApproval = actionId.startsWith('approve_');
      const actionType = isApproval ? 'approve' : 'deny';
      
      // Get the user who clicked the button - need to look up by Slack user ID
      const slackUserId = payload.user.id;
      
      // Look up user's email from Slack API
      const token = process.env.SLACK_BOT_TOKEN;
      if (!token) {
        console.error('SLACK_BOT_TOKEN not configured');
        return NextResponse.json({
          replace_original: false,
          text: '⚠️ Configuration error. Please contact an administrator.'
        });
      }
      
      const userResponse = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const userData = await userResponse.json();
      const approverEmail = userData.user?.profile?.email;
      
      if (!approverEmail) {
        console.error('Could not find email for Slack user:', slackUserId);
        return NextResponse.json({
          replace_original: false,
          text: '⚠️ Could not identify your email. Please contact an administrator.'
        });
      }
      
      console.log(`Approver: ${approverEmail}, Action: ${actionType}, ApprovalId: ${approvalId}`);
      
      // Process the approval directly (don't make HTTP call)
      try {
        const client = await MongoClient.connect(uri);
        const db = client.db('abg-website');

        // Find the approval request
        const approval = await db.collection('pendingApprovals').findOne({ approvalId, status: 'pending' });
        
        if (!approval) {
          await client.close();
          return NextResponse.json({
            replace_original: false,
            text: '⚠️ Approval request not found or already processed.'
          });
        }

        // Look up the user who's trying to approve
        console.log(`Looking up user with email: ${approverEmail}`);
        const clickerUser = await db.collection('users').findOne({ 
          email: { $regex: new RegExp(`^${approverEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        console.log('User found:', clickerUser ? 'Yes' : 'No');
        if (clickerUser) {
          console.log('User email:', clickerUser.email);
          console.log('User roles:', clickerUser.roles);
        }
        
        // Check if user is an admin
        if (!clickerUser || !clickerUser.roles || 
            (!clickerUser.roles.includes('admin') && !clickerUser.roles.includes('super-admin'))) {
          await client.close();
          console.error('User not authorized - not an admin or user not found');
          return NextResponse.json({
            replace_original: false,
            text: `⚠️ Only admins can approve notifications. Email found: ${approverEmail}, User exists: ${!!clickerUser}, Roles: ${clickerUser?.roles?.join(', ') || 'none'}`
          });
        }
        
        console.log('User authorized as admin');

        if (actionType === 'approve') {
          // Execute the approved action
          if (approval.actionType === 'send') {
            // Send email immediately
            await sendEmail({
              to: approval.requesterEmail,
              bcc: approval.recipients,
              subject: approval.subject,
              html: approval.htmlContent,
              replyTo: 'ABGcontact@umich.edu',
              attachments: approval.attachments || []
            });
            console.log(`✅ Approved email sent to ${approval.recipients.length} recipients`);
          } else if (approval.actionType === 'schedule') {
            // Schedule email directly in MongoDB
            const scheduledFor = new Date(`${approval.scheduleDate}T${approval.scheduleTime}`);
            
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

        } else if (actionType === 'deny') {
          // Save as draft
          const draft = {
            ...approval.draftData,
            createdBy: approval.requesterEmail,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await db.collection('emailDrafts').insertOne(draft);
          console.log(`✅ Email saved as draft after denial`);

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
              status: actionType === 'approve' ? 'approved' : 'denied',
              processedAt: new Date()
            } 
          }
        );

        await client.close();
        await client.close();

        // Update the message to show it was processed
        return NextResponse.json({
          replace_original: true,
          text: isApproval 
            ? `✅ *Approved!*\n\nYou approved this notification. The requester has been notified.`
            : `❌ *Denied*\n\nYou denied this notification request. It has been saved as a draft for revision.`
        });
      } catch (error) {
        console.error('Error processing approval:', error);
        return NextResponse.json({
          replace_original: false,
          text: '⚠️ Error processing your response. Please try again.'
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack interactivity error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
