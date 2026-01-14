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
    
    // Get questions for this specific track
    const specificTrackQuestions = allQuestions.find(q => q.track === track);
    // Get questions marked for "both" tracks (shared questions)
    const bothTrackQuestions = allQuestions.find(q => q.track === 'both');
    
    // Combine fields from both, with "both" questions first, then track-specific
    const combinedFields = [
      ...(bothTrackQuestions?.fields || []),
      ...(specificTrackQuestions?.fields || []),
    ];
    
    // Sort by order field
    combinedFields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    return NextResponse.json({
      fields: combinedFields,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
