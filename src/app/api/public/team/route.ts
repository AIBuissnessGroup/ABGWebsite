import { NextResponse } from 'next/server';
import { getActiveTeamMembers } from '@/lib/site-content/team';

export async function GET() {
  try {
    const members = await getActiveTeamMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members (public):', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
