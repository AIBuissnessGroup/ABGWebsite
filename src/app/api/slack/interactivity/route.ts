import { NextRequest, NextResponse } from 'next/server';

/**
 * Slack Interactivity Webhook Handler
 * Handles button clicks and other interactive elements from Slack messages
 * 
 * Configure this URL in Slack App Settings > Interactivity & Shortcuts:
 * https://yourdomain.com/api/slack/interactivity
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const payloadStr = params.get('payload');
    
    if (!payloadStr) {
      return NextResponse.json({ error: 'No payload' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    
    // Handle button actions
    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      const actionId = action.action_id;
      const approvalId = action.value;
      
      // Determine if approve or deny
      const isApproval = actionId.startsWith('approve_');
      const actionType = isApproval ? 'approve' : 'deny';
      
      // Get the user who clicked the button
      const approverEmail = payload.user.profile?.email || payload.user.email;
      
      // Call the approval handler
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notifications/request-approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          action: actionType,
          approverEmail
        })
      });

      if (response.ok) {
        // Update the message to show it was processed
        return NextResponse.json({
          replace_original: true,
          text: isApproval 
            ? `✅ *Approved!*\n\nYou approved this notification. The requester has been notified.`
            : `❌ *Denied*\n\nYou denied this notification request. It has been saved as a draft for revision.`
        });
      } else {
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
