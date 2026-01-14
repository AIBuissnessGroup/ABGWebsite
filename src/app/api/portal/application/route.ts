/**
 * Portal Application API
 * GET - Get user's current application
 * POST - Create a new application (start applying)
 * PUT - Save application draft (autosave)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getActiveCycle,
  getApplicationByUser,
  saveApplicationDraft,
  getQuestionsByCycle,
} from '@/lib/recruitment/db';
import type { ApplicationTrack } from '@/types/recruitment';

// CORS helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const cycle = await getActiveCycle();
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'No active recruitment cycle' }, { status: 404 })
      );
    }

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;
    const application = await getApplicationByUser(cycleId, userId);

    if (!application) {
      return corsResponse(NextResponse.json({ application: null }));
    }

    // Also get the questions for this track
    const allQuestions = await getQuestionsByCycle(cycleId);
    const questions = allQuestions.filter(q => q.track === application.track || q.track === 'both');

    return corsResponse(NextResponse.json({ 
      application,
      questions,
    }));
  } catch (error) {
    console.error('Error fetching application:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const cycle = await getActiveCycle();
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'No active recruitment cycle' }, { status: 404 })
      );
    }

    // Check if portal is open and before deadline
    const now = new Date();
    if (now < new Date(cycle.portalOpenAt)) {
      return corsResponse(
        NextResponse.json({ error: 'Portal not yet open' }, { status: 403 })
      );
    }
    if (now > new Date(cycle.applicationDueAt)) {
      return corsResponse(
        NextResponse.json({ error: 'Application deadline has passed' }, { status: 403 })
      );
    }

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;

    // Check if user already has an application
    const existing = await getApplicationByUser(cycleId, userId);
    if (existing) {
      return corsResponse(
        NextResponse.json({ error: 'Application already exists', application: existing }, { status: 400 })
      );
    }

    const data = await request.json();

    // Validate track
    const validTracks: ApplicationTrack[] = ['business', 'engineering', 'ai_investment_fund', 'ai_energy_efficiency'];
    if (!data.track || !validTracks.includes(data.track)) {
      return corsResponse(
        NextResponse.json({ error: 'Valid track is required' }, { status: 400 })
      );
    }

    // Use saveApplicationDraft to create a new draft application
    const applicationId = await saveApplicationDraft({
      cycleId,
      userId,
      track: data.track,
      answers: data.answers || {},
    });

    const application = await getApplicationByUser(cycleId, userId);

    // Get questions for this track
    const allQuestions = await getQuestionsByCycle(cycleId);
    const questions = allQuestions.filter(q => q.track === data.track || q.track === 'both');

    return corsResponse(NextResponse.json({ 
      application,
      questions,
    }, { status: 201 }));
  } catch (error) {
    console.error('Error creating application:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const cycle = await getActiveCycle();
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'No active recruitment cycle' }, { status: 404 })
      );
    }

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;
    const application = await getApplicationByUser(cycleId, userId);

    if (!application) {
      return corsResponse(
        NextResponse.json({ error: 'No application found' }, { status: 404 })
      );
    }

    // Can only save drafts if not yet submitted
    if (application.stage !== 'draft' && application.stage !== 'not_started') {
      return corsResponse(
        NextResponse.json({ error: 'Cannot modify submitted application' }, { status: 400 })
      );
    }

    const data = await request.json();
    
    console.log('📝 Application PUT - received data:', {
      userId,
      hasAnswers: !!data.answers,
      answerKeys: data.answers ? Object.keys(data.answers) : [],
      hasFiles: !!data.files,
      fileKeys: data.files ? Object.keys(data.files) : [],
      files: data.files,
    });

    // This is the autosave endpoint - saves both answers and files
    await saveApplicationDraft({
      cycleId,
      userId,
      track: application.track,
      answers: data.answers || {},
      files: data.files || {},
    });

    const updatedApplication = await getApplicationByUser(cycleId, userId);
    
    console.log('📝 Application PUT - saved application files:', updatedApplication?.files);

    return corsResponse(NextResponse.json({ 
      application: updatedApplication,
      savedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error saving application:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
    );
  }
}
