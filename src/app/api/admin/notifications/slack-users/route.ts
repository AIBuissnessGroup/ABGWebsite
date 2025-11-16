import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch Slack users list
    const slackToken = process.env.SLACK_BOT_TOKEN;
    
    if (!slackToken) {
      return NextResponse.json({ 
        users: [],
        error: 'Slack token not configured' 
      });
    }

    const response = await fetch('https://slack.com/api/users.list', {
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return NextResponse.json({ users: [] });
    }

    // Map Slack users to our format
    const users = data.members
      .filter((member: any) => 
        !member.deleted && 
        !member.is_bot && 
        member.profile?.email &&
        member.id !== 'USLACKBOT'
      )
      .map((member: any) => ({
        email: member.profile.email,
        name: member.profile.real_name || member.name,
        slackId: member.id,
        isAdmin: member.is_admin || member.is_owner || member.is_primary_owner || false
      }));

    return NextResponse.json({ 
      success: true,
      users 
    });

  } catch (error) {
    console.error('Failed to fetch Slack users:', error);
    return NextResponse.json({ users: [] });
  }
}
