import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getConferenceData, upsertConferenceData } from '@/lib/site-content/conference';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getConferenceData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching admin conference data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conference data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { _id, ...safeData } = data;
    const result = await upsertConferenceData(safeData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating conference data:', error);
    return NextResponse.json(
      { error: 'Failed to update conference data' },
      { status: 500 }
    );
  }
}
