/**
 * Recruitment Questions API
 * GET - Get questions for a cycle/track
 * POST/PUT - Create or update questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getQuestionsByCycle, upsertQuestions, getCycleById } from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { ApplicationTrack, ApplicationQuestions } from '@/types/recruitment';

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

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const track = searchParams.get('track') as ApplicationTrack | null;

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    const allQuestions = await getQuestionsByCycle(cycleId);
    
    // Filter by track if specified
    const questions = track 
      ? allQuestions.filter(q => q.track === track)
      : allQuestions;
    
    return corsResponse(NextResponse.json(questions));
  } catch (error) {
    console.error('Error fetching questions:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const data = await request.json();

    // Validate required fields
    if (!data.cycleId || !data.track || !data.fields) {
      return corsResponse(
        NextResponse.json(
          { error: 'cycleId, track, and fields are required' },
          { status: 400 }
        )
      );
    }

    // Validate track
    const validTracks: ApplicationTrack[] = ['business', 'engineering', 'ai_investment_fund', 'ai_energy_efficiency', 'both'];
    if (!validTracks.includes(data.track)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid track' }, { status: 400 })
      );
    }

    // Verify cycle exists
    const cycle = await getCycleById(data.cycleId);
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
      );
    }

    // Validate fields structure
    if (!Array.isArray(data.fields)) {
      return corsResponse(
        NextResponse.json({ error: 'Fields must be an array' }, { status: 400 })
      );
    }

    // Validate each field
    const validFieldTypes = ['text', 'textarea', 'select', 'multiselect', 'file', 'url', 'email', 'phone', 'number', 'date', 'checkbox'];
    for (const field of data.fields) {
      if (!field.key || !field.label || !field.type) {
        return corsResponse(
          NextResponse.json({ error: 'Each field must have key, label, and type' }, { status: 400 })
        );
      }
      if (!validFieldTypes.includes(field.type)) {
        return corsResponse(
          NextResponse.json({ error: `Invalid field type: ${field.type}` }, { status: 400 })
        );
      }
    }

    const questionsData: Omit<ApplicationQuestions, '_id'> = {
      cycleId: data.cycleId,
      track: data.track,
      fields: data.fields,
    };

    await upsertQuestions(questionsData);
    
    // Fetch the updated questions
    const allQuestions = await getQuestionsByCycle(data.cycleId);
    const updatedQuestions = allQuestions.find(q => q.track === data.track);

    const adminId = session.user.id || session.user.email;

    // Audit log
    await logAuditEvent(
      adminId,
      session.user.email,
      'content.updated',
      'RecruitmentQuestions',
      {
        targetId: updatedQuestions?._id || data.cycleId,
        meta: {
          cycleId: data.cycleId,
          track: data.track,
          fieldCount: data.fields.length,
        },
      }
    );

    // Ensure the response is JSON serializable (handles any remaining ObjectIds or Date objects)
    const serializedQuestions = JSON.parse(JSON.stringify(updatedQuestions ?? null));
    return corsResponse(NextResponse.json(serializedQuestions));
  } catch (error) {
    console.error('Error saving questions:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
    );
  }
}

// PUT is same as POST for upsert behavior
export { POST as PUT };
