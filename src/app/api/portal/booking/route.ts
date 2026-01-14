/**
 * Portal Booking API (Coffee Chats & Interviews)
 * POST - Book a slot
 * DELETE - Cancel a booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getActiveCycle,
  getApplicationByUser,
  getSlotById,
  getBookingsBySlot,
  getBookingsByUser,
  createBooking,
  cancelBooking as cancelBookingDb,
  updateApplicationStage,
  getBookingById,
  updateBooking,
} from '@/lib/recruitment/db';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/calendar';
import type { SlotBooking, SlotKind, ApplicationStage } from '@/types/recruitment';

// Friendly names for slot kinds
const SLOT_KIND_LABELS: Record<SlotKind, string> = {
  coffee_chat: 'Coffee Chat',
  interview_round1: 'Interview Round 1',
  interview_round2: 'Interview Round 2',
};

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

// Map slot kind to the stage it requires and the stage it transitions to
const STAGE_REQUIREMENTS: Record<SlotKind, { requires: ApplicationStage[]; transitions_to: ApplicationStage }> = {
  coffee_chat: {
    requires: ['draft', 'submitted', 'under_review'],
    transitions_to: 'coffee_chat',
  },
  interview_round1: {
    requires: ['interview_round1'], // User must be at interview_round1 stage
    transitions_to: 'interview_round1',
  },
  interview_round2: {
    requires: ['interview_round2'], // User must be at interview_round2 stage
    transitions_to: 'interview_round2',
  },
};

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

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;

    const data = await request.json();

    if (!data.slotId) {
      return corsResponse(
        NextResponse.json({ error: 'slotId is required' }, { status: 400 })
      );
    }

    // Verify slot exists
    const slot = await getSlotById(data.slotId);
    if (!slot) {
      return corsResponse(
        NextResponse.json({ error: 'Slot not found' }, { status: 404 })
      );
    }

    if (slot.cycleId !== cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'Slot not in current cycle' }, { status: 400 })
      );
    }

    // Check if slot is in the future
    if (new Date() > new Date(slot.startTime)) {
      return corsResponse(
        NextResponse.json({ error: 'Slot has already started' }, { status: 400 })
      );
    }

    // Get user's application (may be null for coffee chats)
    const application = await getApplicationByUser(cycleId, userId);

    // Check stage requirements for interviews (not coffee chats)
    if (slot.kind !== 'coffee_chat') {
      // Interviews require an application
      if (!application) {
        return corsResponse(
          NextResponse.json({ error: 'You must submit an application first' }, { status: 400 })
        );
      }
      
      const requirements = STAGE_REQUIREMENTS[slot.kind];
      if (!requirements.requires.includes(application.stage)) {
        return corsResponse(
          NextResponse.json({ 
            error: 'You are not eligible to book this slot at your current stage',
            currentStage: application.stage,
          }, { status: 400 })
        );
      }
      
      // Check track restriction - slot must be for user's track or have no track restriction
      if (slot.forTrack && slot.forTrack !== application.track) {
        return corsResponse(
          NextResponse.json({ 
            error: 'This interview slot is for a different track',
            slotTrack: slot.forTrack,
            yourTrack: application.track,
          }, { status: 400 })
        );
      }
    }

    // Check if user already has an active/confirmed booking for this kind
    const userBookings = await getBookingsByUser(cycleId, userId);
    console.log('User bookings for slot kind check:', userBookings.map(b => ({ 
      slotKind: b.slotKind, 
      status: b.status, 
      slotId: b.slotId 
    })));
    const existingBooking = userBookings.find(b => b.slotKind === slot.kind && b.status === 'confirmed');
    if (existingBooking) {
      return corsResponse(
        NextResponse.json({ 
          error: 'You already have a booking for this type',
          booking: existingBooking,
        }, { status: 400 })
      );
    }

    // Check slot capacity
    const existingBookings = await getBookingsBySlot(data.slotId);
    const activeBookings = existingBookings.filter(b => b.status === 'confirmed');
    if (activeBookings.length >= slot.maxBookings) {
      return corsResponse(
        NextResponse.json({ error: 'Slot is fully booked' }, { status: 400 })
      );
    }

    // Create booking
    // For coffee chats, applicationId is optional (user may not have started application yet)
    const bookingData: Omit<SlotBooking, '_id' | 'createdAt' | 'updatedAt'> = {
      cycleId,
      slotId: data.slotId,
      userId, // Always store the user ID for tracking
      applicationId: application?._id || undefined,
      slotKind: slot.kind,
      applicantName: session.user.name || '',
      applicantEmail: session.user.email,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    };

    const bookingId = await createBooking(bookingData);

    // Create Google Calendar event with both applicant and host
    const applicantName = session.user.name || session.user.email?.split('@')[0] || 'Applicant';
    const slotKindLabel = SLOT_KIND_LABELS[slot.kind] || slot.kind;
    
    // Calculate end time
    const startTime = new Date(slot.startTime);
    const endTime = slot.endTime 
      ? new Date(slot.endTime) 
      : new Date(startTime.getTime() + slot.durationMinutes * 60000);
    
    const calendarResult = await createCalendarEvent({
      summary: `ABG ${slotKindLabel}: ${applicantName} & ${slot.hostName}`,
      description: `${slotKindLabel} between ${applicantName} and ${slot.hostName} for ABG Recruitment.\n\n${slot.meetingUrl ? `Join meeting: ${slot.meetingUrl}` : ''}`.trim(),
      location: slot.location || slot.meetingUrl || 'TBD',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees: [
        { email: session.user.email!, displayName: applicantName },
        { email: slot.hostEmail, displayName: slot.hostName },
      ],
      meetingUrl: slot.meetingUrl,
    });

    // Update booking with calendar event details if created
    if (calendarResult.success && calendarResult.eventId) {
      await updateBooking(bookingId, {
        calendarEventId: calendarResult.eventId,
        calendarEventLink: calendarResult.htmlLink,
      });
    }

    // Update application stage if this is an interview and we have an application
    // Note: For interviews, the user should already be at the correct stage to book,
    // so we don't need to transition them - they're already there
    // (Removed stage transition logic since users must be at correct stage to book)

    return corsResponse(NextResponse.json({ 
      bookingId,
      message: 'Booking confirmed!',
      calendarEvent: calendarResult.success ? {
        created: true,
        link: calendarResult.htmlLink,
      } : {
        created: false,
        error: calendarResult.error,
      },
    }, { status: 201 }));
  } catch (error) {
    console.error('Error creating booking:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return corsResponse(
        NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
      );
    }

    const userId = session.user.id || session.user.email;
    const cycleId = cycle._id!;

    // Verify the booking belongs to this user
    const userBookings = await getBookingsByUser(cycleId, userId);
    const booking = userBookings.find(b => b._id === bookingId);

    if (!booking) {
      return corsResponse(
        NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      );
    }

    if (booking.status === 'cancelled') {
      return corsResponse(
        NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 })
      );
    }

    // Check if slot hasn't started yet
    const slot = await getSlotById(booking.slotId);
    if (slot && new Date() > new Date(slot.startTime)) {
      return corsResponse(
        NextResponse.json({ error: 'Cannot cancel past bookings' }, { status: 400 })
      );
    }

    // Delete the Google Calendar event if it exists
    if (booking.calendarEventId) {
      await deleteCalendarEvent(booking.calendarEventId);
    }

    // Cancel the booking
    await cancelBookingDb(bookingId);

    return corsResponse(NextResponse.json({ 
      success: true,
      message: 'Booking cancelled',
    }));
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    );
  }
}
