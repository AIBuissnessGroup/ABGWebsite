/**
 * Phase Reviews API
 * GET - Get reviews for a specific phase
 * POST - Create or update a phase review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getReviewsByPhase,
  getPhaseReviewSummary,
  upsertPhaseReview,
  getApplicationById,
  getPhaseConfig,
  getBookingsByApplication,
  getSlotById,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { 
  ApplicationReview, 
  ReviewPhase, 
  ReviewRecommendation,
  ReferralSignal,
  ApplicationTrack,
} from '@/types/recruitment';

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
    const phase = searchParams.get('phase') as ReviewPhase | null;

    if (!applicationId || !phase) {
      return corsResponse(
        NextResponse.json({ error: 'applicationId and phase are required' }, { status: 400 })
      );
    }

    // Validate phase
    const validPhases: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];
    if (!validPhases.includes(phase)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
      );
    }

    // Get reviews for this phase
    const reviews = await getReviewsByPhase(applicationId, phase);
    
    // Get summary
    const summary = await getPhaseReviewSummary(applicationId, phase);

    // For interview phases, get interview details
    let interviewDetails = null;
    if (phase === 'interview_round1' || phase === 'interview_round2') {
      const bookings = await getBookingsByApplication(applicationId);
      const interviewBooking = bookings.find(
        b => b.slotKind === phase && b.status !== 'cancelled'
      );
      
      if (interviewBooking) {
        const slot = await getSlotById(interviewBooking.slotId);
        const now = new Date();
        const interviewTime = new Date(interviewBooking.slotDetails?.startTime || slot?.startTime || '');
        
        interviewDetails = {
          bookingId: interviewBooking._id,
          time: interviewBooking.slotDetails?.startTime || slot?.startTime,
          location: interviewBooking.slotDetails?.location || slot?.location,
          interviewers: [slot?.hostName].filter(Boolean),
          interviewerEmails: [slot?.hostEmail].filter(Boolean),
          completed: interviewBooking.status === 'completed' || 
                     (interviewTime < now && interviewBooking.status === 'confirmed'),
        };
      }
    }

    // Transform response to match frontend expectations
    const reviewsWithNames = reviews.map(r => ({
      ...r,
      reviewerName: r.reviewerEmail?.split('@')[0] || 'Anonymous',
    }));

    return corsResponse(NextResponse.json({
      reviews: reviewsWithNames,
      avgScores: summary?.scores || {},
      totalReviews: reviews.length,
      summary,
      interviewDetails,
    }));
  } catch (error) {
    console.error('Error fetching phase reviews:', error);
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
    if (!data.applicationId || !data.phase || !data.scores) {
      return corsResponse(
        NextResponse.json(
          { error: 'applicationId, phase, and scores are required' },
          { status: 400 }
        )
      );
    }

    // Validate phase
    const validPhases: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];
    if (!validPhases.includes(data.phase)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
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

    // Validate referral signal if provided
    const validSignals: ReferralSignal[] = ['referral', 'neutral', 'deferral'];
    if (data.referralSignal && !validSignals.includes(data.referralSignal)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid referral signal' }, { status: 400 })
      );
    }

    // Get application to get cycleId
    const application = await getApplicationById(data.applicationId);
    if (!application) {
      return corsResponse(
        NextResponse.json({ error: 'Application not found' }, { status: 404 })
      );
    }

    // Check if phase is finalized
    const phaseConfig = await getPhaseConfig(application.cycleId, data.phase);
    console.log('Phase config for review:', { 
      cycleId: application.cycleId, 
      phase: data.phase, 
      status: phaseConfig?.status,
      finalizedAt: phaseConfig?.finalizedAt 
    });
    if (phaseConfig?.status === 'finalized') {
      return corsResponse(
        NextResponse.json({ 
          error: 'Cannot modify reviews for a finalized phase',
          debug: {
            cycleId: application.cycleId,
            phase: data.phase,
            status: phaseConfig.status,
            finalizedAt: phaseConfig.finalizedAt,
          }
        }, { status: 400 })
      );
    }

    const adminEmail = session.user.email;
    const adminName = session.user.name || session.user.email;

    // Get existing reviews to check if this is an update
    const existingReviews = await getReviewsByPhase(data.applicationId, data.phase);
    const existingReview = existingReviews.find(r => r.reviewerEmail === adminEmail);

    // Build interview details if this is an interview phase
    let interviewDetails;
    if (data.phase === 'interview_round1' || data.phase === 'interview_round2') {
      const bookings = await getBookingsByApplication(data.applicationId);
      const interviewBooking = bookings.find(
        b => b.slotKind === data.phase && b.status !== 'cancelled'
      );
      
      if (interviewBooking) {
        const slot = await getSlotById(interviewBooking.slotId);
        interviewDetails = {
          bookingId: interviewBooking._id,
          interviewerNames: [slot?.hostName].filter((n): n is string => Boolean(n)),
          interviewerEmails: [slot?.hostEmail].filter((e): e is string => Boolean(e)),
          interviewTime: interviewBooking.slotDetails?.startTime || slot?.startTime,
          interviewLocation: interviewBooking.slotDetails?.location || slot?.location,
          interviewCompleted: data.interviewCompleted ?? true,
        };
      }
    }

    const reviewData: Omit<ApplicationReview, '_id'> = {
      cycleId: application.cycleId,
      applicationId: data.applicationId,
      phase: data.phase,
      reviewerEmail: adminEmail,
      reviewerName: adminName,
      scores: data.scores,
      notes: data.notes,
      questionNotes: data.questionNotes,  // Per-question notes for interview phases
      recommendation: data.recommendation,
      referralSignal: data.referralSignal || 'neutral',
      audioRecordingUrl: data.audioRecordingUrl,  // Audio recording for interview
      interviewDetails,
    };

    await upsertPhaseReview(reviewData);

    // Fetch updated reviews
    const updatedReviews = await getReviewsByPhase(data.applicationId, data.phase);
    const newReview = updatedReviews.find(r => r.reviewerEmail === adminEmail);
    const summary = await getPhaseReviewSummary(data.applicationId, data.phase);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      adminEmail,
      existingReview ? 'content.updated' : 'content.created',
      'RecruitmentPhaseReview',
      {
        targetId: newReview?._id || data.applicationId,
        meta: {
          applicationId: data.applicationId,
          phase: data.phase,
          recommendation: data.recommendation,
          referralSignal: data.referralSignal,
        },
      }
    );

    return corsResponse(NextResponse.json({
      review: newReview,
      summary,
    }, { status: existingReview ? 200 : 201 }));
  } catch (error: any) {
    console.error('Error creating/updating phase review:', error);
    
    if (error.message?.includes('finalized')) {
      return corsResponse(
        NextResponse.json({ error: error.message }, { status: 400 })
      );
    }
    
    return corsResponse(
      NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    );
  }
}
