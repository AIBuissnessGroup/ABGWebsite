import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/server-admin';
import { recruitmentContentStore } from '@/lib/recruitment/content';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(recruitmentContentStore.getTimeline());
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const updated = recruitmentContentStore.updateTimeline(data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating timeline content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

