import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
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
      
      // Check if already processed (prevent duplicate clicks)
      const client = await MongoClient.connect(uri);
      const db = client.db('abg-website');
      const existingApproval = await db.collection('pendingApprovals').findOne({ approvalId });
      
      if (!existingApproval) {
        await client.close();
        return NextResponse.json({
          replace_original: true,
          text: '⚠️ Approval request not found.'
        });
      }
      
      if (existingApproval.status !== 'pending') {
        await client.close();
        const alreadyProcessedMessage = existingApproval.status === 'approved' 
          ? '✅ This notification was already approved and sent.'
          : '❌ This notification was already denied.';
        
        return NextResponse.json({
          replace_original: true,
          text: alreadyProcessedMessage
        });
      }
      
      await client.close();
      
      // Return immediate response with processing message
      const responseMessage = isApproval 
        ? `⏳ Processing approval... Please wait.`
        : `⏳ Processing denial... Please wait.`;
      
      const immediateResponse = NextResponse.json({
        replace_original: true,
        text: responseMessage,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: responseMessage
            }
          }
        ]
      });
      
      // Process approval asynchronously (don't await)
      processApproval(approvalId, actionType, approverEmail, isApproval, payload.response_url).catch(err => {
        console.error('Error in async approval processing:', err);
      });
      
      return immediateResponse;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack interactivity error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Process approval asynchronously
async function processApproval(approvalId: string, actionType: string, approverEmail: string, isApproval: boolean, responseUrl: string) {
  console.log(`🔄 processApproval called: ${approvalId}, ${actionType}, ${approverEmail}`);
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db('abg-website');

    // Find the approval request (double-check status)
    const approval = await db.collection('pendingApprovals').findOne({ approvalId, status: 'pending' });
    
    if (!approval) {
      await client.close();
      console.error('❌ Approval request not found or already processed');
      
      // Update the message to show it was already processed
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          text: '⚠️ This request was already processed.'
        })
      });
      return;
    }

    console.log(`✅ Found approval request for: ${approval.subject}`);

    // Look up the user who's trying to approve (check both email and alternateEmails)
    console.log(`🔍 Looking up user with email: ${approverEmail}`);
    const usersCollection = db.collection('users');
    const clickerUser = await usersCollection.findOne({ 
      $or: [
        { email: { $regex: new RegExp(`^${approverEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { alternateEmails: { $regex: new RegExp(`^${approverEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });
    
    console.log('👤 User found:', clickerUser ? 'Yes' : 'No');
    if (clickerUser) {
      console.log('   Email:', clickerUser.email);
      console.log('   Roles:', clickerUser.roles);
    } else {
      console.error('❌ No user found with email:', approverEmail);
    }
    
    // Check if user is an admin (case-insensitive)
    const userRoles = clickerUser?.roles?.map((r: string) => r.toLowerCase()) || [];
    if (!clickerUser || !clickerUser.roles || 
        (!userRoles.includes('admin') && !userRoles.includes('super-admin'))) {
      await client.close();
      console.error('❌ User not authorized');
      console.error('   User exists:', !!clickerUser);
      console.error('   Has roles:', !!clickerUser?.roles);
      console.error('   Roles:', clickerUser?.roles);
      console.error('   Is admin:', clickerUser?.roles?.includes('admin'));
      console.error('   Is super-admin:', clickerUser?.roles?.includes('super-admin'));
      await sendSlackDM(approval.requesterEmail, {
        text: `⚠️ Approval failed - unauthorized user attempted to approve (${approverEmail})`
      });
      return;
    }
    
    console.log('✅ User authorized as admin');

    if (actionType === 'approve') {
      // Execute the approved action
      if (approval.actionType === 'send') {
        // Send email immediately - loop through recipients one by one
        console.log(`Sending to ${approval.recipients.length} recipients`);
        let sent = 0;
        let failed = 0;
        
        for (const recipient of approval.recipients) {
          try {
            await sendEmail({
              to: recipient,
              subject: approval.subject,
              html: approval.htmlContent,
              replyTo: 'ABGcontact@umich.edu',
              attachments: approval.attachments || []
            });
            sent++;
            console.log(`✅ Sent to ${recipient}`);
          } catch (error) {
            failed++;
            console.error(`❌ Failed to send to ${recipient}:`, error);
          }
        }
        console.log(`✅ Email batch complete: ${sent} sent, ${failed} failed`);
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
      const recipientCount = approval.recipients.length;
      const sendingMessage = approval.actionType === 'send' 
        ? `is being sent to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'} now. Your email will be delivered shortly! 📧`
        : `has been scheduled for ${approval.scheduleDate} ${approval.scheduleTime}`;
      
      await sendSlackDM(approval.requesterEmail, {
        text: `✅ Your notification "${approval.subject}" has been approved by ${approverEmail}!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Notification Approved!*\n\n*Subject:* ${approval.subject}\n*Approved by:* ${approverEmail}\n*Status:* Your email ${sendingMessage}`
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
          processedAt: new Date(),
          processedBy: approverEmail
        } 
      }
    );

    await client.close();
    console.log('✅ Approval processing complete');
    
    // Update the Slack message with final confirmation (no buttons)
    const finalMessage = actionType === 'approve'
      ? `✅ *Approved and ${approval.actionType === 'send' ? 'Sent' : 'Scheduled'}*\n\nNotification "${approval.subject}" was approved by ${approverEmail} and ${approval.actionType === 'send' ? 'sent successfully' : `scheduled for ${approval.scheduleDate} ${approval.scheduleTime}`}.`
      : `❌ *Denied*\n\nNotification "${approval.subject}" was denied by ${approverEmail}. The draft has been saved for editing.`;
    
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replace_original: true,
        text: finalMessage,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: finalMessage
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Processed at: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toLocaleString()}>`
              }
            ]
          }
        ]
      })
    });
    
  } catch (error) {
    console.error('Error in processApproval:', error);
    
    // Try to update message with error
    try {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          text: '❌ An error occurred while processing this request. Please contact an administrator.'
        })
      });
    } catch (e) {
      console.error('Failed to send error message to Slack:', e);
    }
  }
}
