import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock storage for member levels content (persisted in-memory for now)
let memberLevelsContent = {
  heroTitle: 'RECRUITMENT – MEMBER LEVELS',
  generalTitle: 'General Member:',
  generalBullets: [
    'Attend general meetings, open speaker events, and social events.',
    'Learning: Gain valuable AI knowledge at your own pace.',
    'Commitment: Simply pay the membership dues to stay involved with no additional expectations.'
  ],
  projectTitle: 'Project Team Member:',
  projectBullets: [
    'Works and communicates with a real client and deliverables',
    '1:1 networking with industry profs. that we bring in',
    'Private Social events',
    'Our summer internship program',
    'Tailored small-group education sessions & feedback'
  ],
  footerLines: [
    'Commitment: Pay membership dues and contribute actively to a project team, gaining greater returns on your involvement.',
    'By becoming more involved, you’ll gain exclusive opportunities and experiences that will set you apart, providing you with practical skills, mentorship, and industry connections.'
  ],
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(memberLevelsContent);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    memberLevelsContent = { ...memberLevelsContent, ...data, lastUpdated: new Date().toISOString() };
    return NextResponse.json(memberLevelsContent);
  } catch (error) {
    console.error('Error updating member levels content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}


