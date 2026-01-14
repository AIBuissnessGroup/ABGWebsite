import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getQuestionsByCycle } from '@/lib/recruitment/db';
import type { ApplicationTrack } from '@/types/recruitment';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const track = searchParams.get('track') as ApplicationTrack | null;

    if (!cycleId || !track) {
      return NextResponse.json({ error: 'Missing cycleId or track' }, { status: 400 });
    }

    const allQuestions = await getQuestionsByCycle(cycleId);
    
    // Get questions for this track or "both"
    const trackQuestions = allQuestions.find(q => q.track === track || q.track === 'both');
    
    return NextResponse.json({
      fields: trackQuestions?.fields || [],
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
