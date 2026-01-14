/**
 * Portal Application Submit API
 * POST - Submit the application (final submission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getActiveCycle,
  getApplicationByUser,
  submitApplication,
  getQuestionsByCycle,
} from '@/lib/recruitment/db';
import type { QuestionField } from '@/types/recruitment';

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

    // Check deadline
    const now = new Date();
    if (now > new Date(cycle.applicationDueAt)) {
      return corsResponse(
        NextResponse.json({ error: 'Application deadline has passed' }, { status: 403 })
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

    // Can only submit if in draft stage
    if (application.stage !== 'draft' && application.stage !== 'not_started') {
      return corsResponse(
        NextResponse.json({ error: 'Application already submitted' }, { status: 400 })
      );
    }

    // Validate required fields
    const allQuestions = await getQuestionsByCycle(cycleId);
    const questionSets = allQuestions.filter(q => q.track === application.track || q.track === 'both');
    
    const allFields: QuestionField[] = questionSets.flatMap(qs => qs.fields || []);
    const requiredFields = allFields.filter((f: QuestionField) => f.required);
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      // For file fields, check the files object
      if (field.type === 'file') {
        const fileUrl = application.files?.[field.key];
        if (!fileUrl) {
          missingFields.push(field.label);
        }
      } else {
        // For all other fields, check answers
        const answer = application.answers?.[field.key];
        if (answer === undefined || answer === null || answer === '') {
          missingFields.push(field.label);
        }
      }
    }

    if (missingFields.length > 0) {
      return corsResponse(
        NextResponse.json({ 
          error: 'Missing required fields',
          missingFields,
        }, { status: 400 })
      );
    }

    // Validate word limits
    const overLimitFields: string[] = [];
    for (const field of allFields) {
      if (field.wordLimit) {
        const answer = application.answers?.[field.key] || '';
        const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > field.wordLimit) {
          overLimitFields.push(field.label);
        }
      }
    }

    if (overLimitFields.length > 0) {
      return corsResponse(
        NextResponse.json({ 
          error: 'Word limit exceeded',
          overLimitFields,
        }, { status: 400 })
      );
    }

    // Note: File requirement validation is now handled above in the required fields check
    // The cycle.settings?.requireResume and requireHeadshot checks are deprecated
    // since the question fields themselves define which files are required

    // Submit the application
    await submitApplication(cycleId, userId);

    const submittedApplication = await getApplicationByUser(cycleId, userId);

    return corsResponse(NextResponse.json({ 
      application: submittedApplication,
      message: 'Application submitted successfully!',
    }));
  } catch (error) {
    console.error('Error submitting application:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    );
  }
}
