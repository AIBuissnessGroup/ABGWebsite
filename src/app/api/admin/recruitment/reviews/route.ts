/**
 * Recruitment Reviews API
 * GET - List reviews for an application
 * POST - Create or update a review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getReviewsByApplication, 
  upsertReview,
  getApplicationById,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { ApplicationReview, ReviewRecommendation } from '@/types/recruitment';

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
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return corsResponse(
        NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
      );
    }

    const reviews = await getReviewsByApplication(applicationId);
    return corsResponse(NextResponse.json(reviews));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
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
    if (!data.applicationId || !data.scores) {
      return corsResponse(
        NextResponse.json(
          { error: 'applicationId and scores are required' },
          { status: 400 }
        )
      );
    }

    // Validate scores
    if (typeof data.scores !== 'object') {
      return corsResponse(
        NextResponse.json({ error: 'Scores must be an object with category keys' }, { status: 400 })
      );
    }

    // Validate recommendation if provided
    const validRecommendations: ReviewRecommendation[] = ['advance', 'hold', 'reject'];
    if (data.recommendation && !validRecommendations.includes(data.recommendation)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid recommendation' }, { status: 400 })
      );
    }

    // Get application to get cycleId
    const application = await getApplicationById(data.applicationId);
    if (!application) {
      return corsResponse(
        NextResponse.json({ error: 'Application not found' }, { status: 404 })
      );
    }

    const adminEmail = session.user.email;
    const adminName = session.user.name || session.user.email;

    // Check if this admin already has a review
    const existingReviews = await getReviewsByApplication(data.applicationId);
    const existingReview = existingReviews.find(r => r.reviewerEmail === adminEmail);

    const reviewData: Omit<ApplicationReview, '_id'> = {
      cycleId: application.cycleId,
      applicationId: data.applicationId,
      reviewerEmail: adminEmail,
      reviewerName: adminName,
      scores: data.scores,
      notes: data.notes,
      questionNotes: data.questionNotes,  // Per-question notes for interview phases
      recommendation: data.recommendation,
      referralSignal: data.referralSignal,  // Referral/deferral for tie-breaking
      phase: data.phase || application.stage,  // Phase this review is for
    };

    await upsertReview(reviewData);

    // Fetch updated reviews
    const updatedReviews = await getReviewsByApplication(data.applicationId);
    const newReview = updatedReviews.find(r => r.reviewerEmail === adminEmail);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      adminEmail,
      existingReview ? 'content.updated' : 'content.created',
      'RecruitmentReview',
      {
        targetId: newReview?._id || data.applicationId,
        meta: {
          applicationId: data.applicationId,
          recommendation: data.recommendation,
        },
      }
    );

    return corsResponse(NextResponse.json(newReview, { status: existingReview ? 200 : 201 }));
  } catch (error) {
    console.error('Error creating/updating review:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    );
  }
}
