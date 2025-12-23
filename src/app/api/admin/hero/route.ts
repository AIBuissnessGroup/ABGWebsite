import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getHeroContent, upsertHeroContent } from '@/lib/site-content/hero';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const heroContent = await getHeroContent();
    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero content' },
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
    const heroContent = await upsertHeroContent(data);
    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json(
      { error: 'Failed to update hero content' },
      { status: 500 }
    );
  }
}
