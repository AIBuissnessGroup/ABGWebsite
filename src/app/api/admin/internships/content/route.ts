import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { internshipsStore } from '@/lib/internships/store';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(internshipsStore.getContent());
  } catch (error) {
    console.error('Error fetching internships page content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const updated = internshipsStore.updateContent(data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating internships page content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
