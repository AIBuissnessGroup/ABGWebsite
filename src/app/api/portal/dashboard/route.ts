/**
 * Portal Dashboard API
 * GET - Get the applicant's dashboard for the active cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getActiveCycle,
  getUpcomingCycle,
  getApplicationByUser,
  getEventsByCycle,
  getRsvpsByUser,
  getAvailableSlots,
  getBookingsByUser,
  getQuestionsByCycle,
  getSlotById,
} from '@/lib/recruitment/db';
import type { 
  PortalDashboard, 
  SlotBooking, 
  Application,
  ApplicationStage,
  RoundTrackerData,
  RoundStatus,
  NextActionInfo,
  ReviewPhase,
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

    // Get active cycle
    const cycle = await getActiveCycle();
    
    if (!cycle) {
      // Check for upcoming cycle to show countdown
      const upcomingCycle = await getUpcomingCycle();
      return corsResponse(
        NextResponse.json({ 
          error: 'No active recruitment cycle',
          upcomingCycle: upcomingCycle || null,
        }, { status: 404 })
      );
    }

    // Check if portal is open
    const now = new Date();
    console.log('Portal date check:', {
      now: now.toISOString(),
      portalOpenAt: cycle.portalOpenAt,
      portalCloseAt: cycle.portalCloseAt,
      isBeforeOpen: now < new Date(cycle.portalOpenAt),
      isAfterClose: now > new Date(cycle.portalCloseAt),
    });
    
    // TODO: Re-enable date checks after testing
    const BYPASS_DATE_CHECK = process.env.NODE_ENV === 'development';
    
    if (!BYPASS_DATE_CHECK && now < new Date(cycle.portalOpenAt)) {
      return corsResponse(
        NextResponse.json({ 
          error: 'Portal not yet open',
          opensAt: cycle.portalOpenAt,
        }, { status: 403 })
      );
    }

    if (!BYPASS_DATE_CHECK && now > new Date(cycle.portalCloseAt)) {
      return corsResponse(
        NextResponse.json({ 
          error: 'Portal is closed',
          closedAt: cycle.portalCloseAt,
        }, { status: 403 })
      );
    }

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;

    // Get user's application if exists
    const application = await getApplicationByUser(cycleId, userId);

    // Get events for this cycle
    const events = await getEventsByCycle(cycleId);

    // Get user's RSVPs
    const rsvps = await getRsvpsByUser(cycleId, userId);

    // Get available slots
    const coffeeChats = await getAvailableSlots(cycleId, 'coffee_chat');
    
    // Only show interview slots if user is at the right stage
    // Also filter by track - applicants only see slots for their track (or general slots)
    let interviewsR1: any[] = [];
    let interviewsR2: any[] = [];
    if (application) {
      const stage = application.stage;
      const track = application.track;
      
      // Show interview_round1 slots for users at interview_round1 stage
      if (stage === 'interview_round1') {
        interviewsR1 = await getAvailableSlots(cycleId, 'interview_round1', track);
      }
      // Show interview_round2 slots for users at interview_round2 stage
      if (stage === 'interview_round2') {
        interviewsR2 = await getAvailableSlots(cycleId, 'interview_round2', track);
      }
    }

    // Get user's bookings
    const bookings = await getBookingsByUser(cycleId, userId);
    console.log('User bookings from DB:', bookings.map(b => ({ 
      slotKind: b.slotKind, 
      status: b.status, 
      slotId: b.slotId 
    })));
    
    // Populate slot details for each booking
    const bookingsWithDetails: SlotBooking[] = await Promise.all(
      bookings.map(async (booking) => {
        const slot = await getSlotById(booking.slotId);
        console.log(`Slot ${booking.slotId} lookup result:`, slot ? 'found' : 'NOT FOUND');
        if (slot) {
          return {
            ...booking,
            slotDetails: {
              startTime: slot.startTime,
              endTime: slot.endTime,
              durationMinutes: slot.durationMinutes,
              hostName: slot.hostName,
              hostEmail: slot.hostEmail,
              location: slot.location,
              meetingUrl: slot.meetingUrl,
            },
          };
        }
        return booking;
      })
    );
    console.log('Bookings with details:', bookingsWithDetails.map(b => ({ 
      slotKind: b.slotKind, 
      status: b.status,
      hasDetails: !!b.slotDetails 
    })));

    // Get questions for all tracks
    const questions = await getQuestionsByCycle(cycleId);

    // Build round tracker data
    const roundTracker = buildRoundTrackerData(application, bookingsWithDetails, cycle.applicationDueAt);

    const dashboard: PortalDashboard = {
      activeCycle: cycle,
      application,
      // Show events that haven't ended yet (includes currently happening events)
      upcomingEvents: events.filter(e => new Date(e.endAt) > now),
      myRsvps: rsvps,
      availableSlots: [...coffeeChats, ...interviewsR1, ...interviewsR2],
      myBookings: bookingsWithDetails,
      questions,
      roundTracker,
    };

    return corsResponse(NextResponse.json(dashboard));
  } catch (error) {
    console.error('Error fetching portal dashboard:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
    );
  }
}

/**
 * Build the 3-step round tracker data for the applicant portal
 */
function buildRoundTrackerData(
  application: Application | null,
  bookings: SlotBooking[],
  applicationDueAt?: Date | string
): RoundTrackerData {
  const now = new Date();
  
  // Default for no application
  if (!application || application.stage === 'not_started') {
    return {
      currentRound: 1,
      roundName: 'Application',
      status: 'waiting',
      nextAction: {
        type: 'finish_application',
        title: 'Start Your Application',
        description: 'Complete and submit your application to be considered for membership.',
        actionUrl: '/portal/application',
        deadline: applicationDueAt ? new Date(applicationDueAt).toISOString() : undefined,
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'in_progress' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    };
  }

  const stage = application.stage;
  
  // Map stages to round tracker data
  const stageToRoundData: Record<ApplicationStage, () => RoundTrackerData> = {
    draft: () => ({
      currentRound: 1,
      roundName: 'Application',
      status: 'waiting',
      nextAction: {
        type: 'finish_application',
        title: 'Complete Your Application',
        description: 'Your application is saved as a draft. Finish and submit it before the deadline.',
        actionUrl: '/portal/application',
        deadline: applicationDueAt ? new Date(applicationDueAt).toISOString() : undefined,
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'in_progress' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    }),
    
    submitted: () => ({
      currentRound: 1,
      roundName: 'Application Review',
      status: 'waiting',
      nextAction: {
        type: 'wait_for_review',
        title: 'Application Under Review',
        description: 'Your application has been submitted and is being reviewed. We will notify you of the next steps.',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'completed' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    }),
    
    under_review: () => ({
      currentRound: 1,
      roundName: 'Application Review',
      status: 'waiting',
      nextAction: {
        type: 'wait_for_review',
        title: 'Application Under Review',
        description: 'Our team is carefully reviewing your application. You will hear back soon.',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'completed' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    }),
    
    coffee_chat: () => ({
      currentRound: 1,
      roundName: 'Application Review',
      status: 'waiting',
      nextAction: {
        type: 'wait_for_review',
        title: 'Coffee Chat Stage',
        description: 'You are in the coffee chat stage. Book a chat with a current member if you have not already.',
        actionUrl: '/portal/schedule',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'completed' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    }),
    
    interview_round1: () => {
      // Check if they have scheduled the interview
      const r1Booking = bookings.find(b => b.slotKind === 'interview_round1' && b.status !== 'cancelled');
      const hasScheduled = !!r1Booking;
      const interviewTime = r1Booking?.slotDetails?.startTime;
      const isInterviewPast = interviewTime && new Date(interviewTime) < now;
      
      return {
        currentRound: 2,
        roundName: 'Technical Interview',
        status: hasScheduled ? (isInterviewPast ? 'completed' : 'scheduled') : 'invited',
        nextAction: hasScheduled 
          ? (isInterviewPast 
            ? {
                type: 'wait_for_decision',
                title: 'Interview Complete',
                description: 'Your technical interview has been completed. We are reviewing your performance.',
              }
            : {
                type: 'attend_interview',
                title: 'Attend Your Interview',
                description: `Your technical interview is scheduled for ${new Date(interviewTime!).toLocaleString()}. Be prepared!`,
              }
            )
          : {
              type: 'schedule_interview',
              title: 'Schedule Your Interview',
              description: 'Congratulations! You have been invited to interview. Schedule your Round 1 (Technical) interview now.',
              actionUrl: '/portal/schedule',
            },
        rounds: [
          { round: 1, name: 'Application', phase: 'application', status: 'advanced' },
          { 
            round: 2, 
            name: 'Technical Interview', 
            phase: 'interview_round1', 
            status: hasScheduled ? (isInterviewPast ? 'completed' : 'in_progress') : 'in_progress',
            scheduledInterview: r1Booking ? {
              bookingId: r1Booking._id!,
              time: interviewTime!,
              location: r1Booking.slotDetails?.location,
              interviewers: r1Booking.slotDetails?.hostName ? [r1Booking.slotDetails.hostName] : undefined,
            } : undefined,
          },
          { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
        ],
      };
    },
    
    interview_round2: () => {
      // Check if they have scheduled the interview
      const r2Booking = bookings.find(b => b.slotKind === 'interview_round2' && b.status !== 'cancelled');
      const hasScheduled = !!r2Booking;
      const interviewTime = r2Booking?.slotDetails?.startTime;
      const isInterviewPast = interviewTime && new Date(interviewTime) < now;
      
      return {
        currentRound: 3,
        roundName: 'Behavioral Interview',
        status: hasScheduled ? (isInterviewPast ? 'completed' : 'scheduled') : 'invited',
        nextAction: hasScheduled 
          ? (isInterviewPast 
            ? {
                type: 'wait_for_decision',
                title: 'Final Interview Complete',
                description: 'Your final interview has been completed. Final decisions will be announced soon.',
              }
            : {
                type: 'attend_interview',
                title: 'Attend Your Final Interview',
                description: `Your behavioral interview is scheduled for ${new Date(interviewTime!).toLocaleString()}. Good luck!`,
              }
            )
          : {
              type: 'schedule_interview',
              title: 'Schedule Final Interview',
              description: 'Congratulations on advancing! Schedule your Round 2 (Behavioral) interview now.',
              actionUrl: '/portal/schedule',
            },
        rounds: [
          { round: 1, name: 'Application', phase: 'application', status: 'advanced' },
          { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'advanced' },
          { 
            round: 3, 
            name: 'Behavioral Interview', 
            phase: 'interview_round2', 
            status: hasScheduled ? (isInterviewPast ? 'completed' : 'in_progress') : 'in_progress',
            scheduledInterview: r2Booking ? {
              bookingId: r2Booking._id!,
              time: interviewTime!,
              location: r2Booking.slotDetails?.location,
              interviewers: r2Booking.slotDetails?.hostName ? [r2Booking.slotDetails.hostName] : undefined,
            } : undefined,
          },
        ],
      };
    },
    
    final_review: () => ({
      currentRound: 3,
      roundName: 'Final Review',
      status: 'decision_pending',
      nextAction: {
        type: 'wait_for_decision',
        title: 'Final Decisions Pending',
        description: 'All interviews are complete. Final decisions are being made and will be announced soon.',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'advanced' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'advanced' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'completed' },
      ],
    }),
    
    waitlisted: () => ({
      currentRound: 3,
      roundName: 'Waitlisted',
      status: 'decision_pending',
      nextAction: {
        type: 'wait_for_decision',
        title: 'You Are On The Waitlist',
        description: 'You have been placed on our waitlist. We will reach out if a spot opens up.',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'advanced' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'advanced' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'completed' },
      ],
    }),
    
    accepted: () => ({
      currentRound: 3,
      roundName: 'Accepted',
      status: 'advanced',
      nextAction: {
        type: 'accepted_next_steps',
        title: 'Welcome to ABG! 🎉',
        description: 'Congratulations! You have been accepted. Check your email for onboarding information.',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'advanced' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'advanced' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'advanced' },
      ],
    }),
    
    rejected: () => {
      // Determine at which stage they were rejected
      // Check their history to see how far they got
      const r1Booking = bookings.find(b => b.slotKind === 'interview_round1');
      const r2Booking = bookings.find(b => b.slotKind === 'interview_round2');
      
      let rejectedAtRound = 1; // Default: rejected at application stage
      if (r2Booking) rejectedAtRound = 3;
      else if (r1Booking) rejectedAtRound = 2;
      
      const roundStatuses: RoundStatus[] = [
        { round: 1, name: 'Application', phase: 'application', status: rejectedAtRound > 1 ? 'advanced' : 'not_advanced' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: rejectedAtRound > 2 ? 'advanced' : (rejectedAtRound === 2 ? 'not_advanced' : 'not_started') },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: rejectedAtRound === 3 ? 'not_advanced' : 'not_started' },
      ];
      
      return {
        currentRound: rejectedAtRound as 1 | 2 | 3,
        roundName: 'Not Advanced',
        status: 'not_advanced',
        nextAction: {
          type: 'not_advanced',
          title: 'Thank You for Applying',
          description: 'We appreciate your interest in ABG. Consider joining as a general member or applying again next semester.',
          actionUrl: 'https://campusgroups.umich.edu/UABG/club_signup',
        },
        rounds: roundStatuses,
      };
    },
    
    withdrawn: () => ({
      currentRound: 1,
      roundName: 'Withdrawn',
      status: 'not_advanced',
      nextAction: {
        type: 'not_advanced',
        title: 'Application Withdrawn',
        description: 'Your application has been withdrawn. You can apply again in a future recruitment cycle.',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'not_advanced' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    }),
    
    not_started: () => ({
      currentRound: 1,
      roundName: 'Application',
      status: 'waiting',
      nextAction: {
        type: 'finish_application',
        title: 'Start Your Application',
        description: 'Begin your application to join ABG.',
        actionUrl: '/portal/application',
      },
      rounds: [
        { round: 1, name: 'Application', phase: 'application', status: 'not_started' },
        { round: 2, name: 'Technical Interview', phase: 'interview_round1', status: 'not_started' },
        { round: 3, name: 'Behavioral Interview', phase: 'interview_round2', status: 'not_started' },
      ],
    }),
  };
  
  const builder = stageToRoundData[stage];
  return builder ? builder() : stageToRoundData.not_started();
}
