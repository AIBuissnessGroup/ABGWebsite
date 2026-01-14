/**
 * Recruitment Application by ID API
 * GET - Get detailed application with all related data
 * PUT - Update application (stage, notes, etc.)
 * DELETE - Delete application
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getApplicationById, 
  updateApplicationStage,
  updateApplicationNotes,
  deleteApplication,
  getReviewsByApplication,
  getBookingsByApplication,
  getEmailLogsByApplication,
  getReviewSummary,
  getRsvpsByUser,
  withConnection,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { ApplicantDetail } from '@/types/recruitment';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const application = await getApplicationById(id);
    
    if (!application) {
      return corsResponse(NextResponse.json({ error: 'Application not found' }, { status: 404 }));
    }

    // Get all related data
    const [reviews, bookings, reviewSummary] = await Promise.all([
      getReviewsByApplication(id),
      getBookingsByApplication(id),
      getReviewSummary(id),
    ]);

    // Get RSVPs for this user in this cycle
    const rsvps = await getRsvpsByUser(application.cycleId, application.userId);
    
    // Enhance bookings with slot details (host info)
    const enhancedBookings = await withConnection(async (db) => {
      const slotsCollection = db.collection('recruitment_slots');
      return Promise.all(bookings.map(async (booking) => {
        if (!booking.slotDetails && booking.slotId) {
          const slot = await slotsCollection.findOne({ _id: new ObjectId(booking.slotId) });
          if (slot) {
            return {
              ...booking,
              slotDetails: {
                startTime: slot.startTime,
                endTime: slot.endTime,
                durationMinutes: slot.durationMinutes,
                hostName: slot.hostName || 'Unknown Host',
                hostEmail: slot.hostEmail,
                location: slot.location,
                meetingUrl: slot.meetingUrl,
              },
            };
          }
        }
        return booking;
      }));
    });
    
    // Enhance RSVPs with event titles and attendance status
    const enhancedRsvps = await withConnection(async (db) => {
      const eventsCollection = db.collection('recruitment_events');
      return Promise.all(rsvps.map(async (rsvp: any) => {
        let eventTitle = rsvp.eventTitle;
        if (!eventTitle && rsvp.eventId) {
          try {
            const event = await eventsCollection.findOne({ _id: new ObjectId(rsvp.eventId) });
            eventTitle = event?.title || `Event ${rsvp.eventId.substring(0, 8)}...`;
          } catch {
            eventTitle = `Event ${rsvp.eventId.substring(0, 8)}...`;
          }
        }
        return {
          ...rsvp,
          eventTitle,
          attended: !!(rsvp.attendedAt || rsvp.checkedInAt),
        };
      }));
    });

    // Get user info from application answers (name and email are mandatory fields)
    let userName = 'Unknown';
    let userEmail = 'unknown@umich.edu';
    
    // Primary: Get name and email from application answers
    if (application.answers) {
      // Look for email in answers
      const emailKey = Object.keys(application.answers).find(k => 
        k === 'email' || k === 'applicant_email' || k.toLowerCase() === 'email'
      );
      if (emailKey && application.answers[emailKey]) {
        userEmail = application.answers[emailKey] as string;
      }
      
      // Look for name in answers
      const nameKey = Object.keys(application.answers).find(k => 
        k === 'name' || k === 'full_name' || k === 'fullName' || 
        k === 'applicant_name' || k.toLowerCase() === 'name'
      );
      if (nameKey && application.answers[nameKey]) {
        userName = application.answers[nameKey] as string;
      }
    }
    
    // Fallback: Check for userEmail/userName stored on application
    if (userEmail === 'unknown@umich.edu' && application.userEmail) {
      userEmail = application.userEmail;
    }
    if (userName === 'Unknown' && application.userName) {
      userName = application.userName;
    }

    const detail: ApplicantDetail = {
      application,
      user: {
        name: userName,
        email: userEmail,
      },
      rsvps: enhancedRsvps,
      bookings: enhancedBookings,
      reviews,
      reviewSummary: reviewSummary || undefined,
    };

    return corsResponse(NextResponse.json(detail));
  } catch (error) {
    console.error('Error fetching application detail:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const application = await getApplicationById(id);
    if (!application) {
      return corsResponse(NextResponse.json({ error: 'Application not found' }, { status: 404 }));
    }

    const data = await request.json();
    const adminId = session.user.id || session.user.email;

    // Handle stage update
    if (data.stage !== undefined) {
      await updateApplicationStage(id, data.stage);

      // Audit log
      await logAuditEvent(
        adminId,
        session.user.email,
        'content.updated',
        'RecruitmentApplication',
        {
          targetId: id,
          meta: {
            action: 'stage_change',
            oldStage: application.stage,
            newStage: data.stage,
          },
        }
      );
    }

    // Handle notes update
    if (data.adminNotes !== undefined) {
      await updateApplicationNotes(id, data.adminNotes);
    }

    // Fetch updated application
    const updatedApplication = await getApplicationById(id);

    return corsResponse(NextResponse.json(updatedApplication));
  } catch (error) {
    console.error('Error updating application:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const application = await getApplicationById(id);
    if (!application) {
      return corsResponse(NextResponse.json({ error: 'Application not found' }, { status: 404 }));
    }

    await deleteApplication(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.deleted',
      'RecruitmentApplication',
      {
        targetId: id,
        meta: {
          userId: application.userId,
          track: application.track,
        },
      }
    );

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting application:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    );
  }
}
