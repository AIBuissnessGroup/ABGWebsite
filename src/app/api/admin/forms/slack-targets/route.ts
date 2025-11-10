import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

async function fetchSlackApi(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`https://slack.com/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Slack API error');
  }

  return data;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = process.env.SLACK_BOT_TOKEN;

    if (!token) {
      return NextResponse.json({
        channels: [],
        users: [],
        needsToken: true,
      });
    }

    const [channelsResponse, usersResponse] = await Promise.all([
      fetchSlackApi('conversations.list?types=public_channel,private_channel&limit=200', token),
      fetchSlackApi('users.list?limit=200', token),
    ]);

    const channels = (channelsResponse.channels || [])
      .filter((channel: any) => !channel.is_archived)
      .map((channel: any) => ({
        id: channel.id,
        name: channel.name || channel.id,
        type: 'channel' as const,
      }));

    const users = (usersResponse.members || [])
      .filter((member: any) => !member.deleted && !member.is_bot && member.id !== 'USLACKBOT')
      .map((member: any) => ({
        id: member.id,
        name: member.profile?.real_name || member.name || member.id,
        type: 'user' as const,
      }));

    return NextResponse.json({ channels, users, needsToken: false });
  } catch (error) {
    console.error('Failed to load Slack targets:', error);
    return NextResponse.json({
      channels: [],
      users: [],
      needsToken: false,
      error: 'Failed to load Slack data',
    }, { status: 500 });
  }
}
