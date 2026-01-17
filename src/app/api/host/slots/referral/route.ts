/**
 * Host Coffee Chat Referral API
 * GET - Get referrals for the current host's bookings
 * POST - Submit or update a referral for a booking
 * 
 * This allows slot hosts to provide feedback (referral/neutral/deferral) 
 * for applicants they've met during coffee chats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getSlotsByHostEmail,
  getBookingsBySlot,
  getBookingById,
  getSlotById,
  getActiveCycle,
  upsertCoffeeChatReferral,
  getCoffeeChatReferralsByHost,
  getApplicationByUser,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { ReferralSignal } from '@/types/recruitment';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hostEmail = session.user.email.toLowerCase();
    
    // Get optional cycleId from query params, default to active cycle
    const { searchParams } = new URL(request.url);
    let cycleId = searchParams.get('cycleId');
    
    if (!cycleId) {
      const activeCycle = await getActiveCycle();
      cycleId = activeCycle?._id || null;
    }

    if (!cycleId) {
      return NextResponse.json({ referrals: [] });
    }

    // Get all referrals this host has given
    const referrals = await getCoffeeChatReferralsByHost(hostEmail, cycleId);

    // Create a map of bookingId -> referral for easy lookup
    const referralMap: Record<string, { signal: ReferralSignal; notes?: string }> = {};
    for (const ref of referrals) {
      referralMap[ref.bookingId] = {
        signal: ref.signal,
        notes: ref.notes,
      };
    }

    return NextResponse.json({ 
      referrals: referralMap,
      count: referrals.length,
    });
  } catch (error) {
    console.error('Error fetching host referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hostEmail = session.user.email.toLowerCase();
    const hostName = session.user.name || hostEmail.split('@')[0];
    
    const data = await request.json();
    const { bookingId, signal, notes } = data;

    // Validate required fields
    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Validate signal
    const validSignals: ReferralSignal[] = ['referral', 'neutral', 'deferral'];
    if (!signal || !validSignals.includes(signal)) {
      return NextResponse.json(
        { error: 'Invalid signal. Must be "referral", "neutral", or "deferral"' },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify the booking is for a coffee chat
    if (booking.slotKind !== 'coffee_chat') {
      return NextResponse.json(
        { error: 'Referrals can only be given for coffee chat bookings' },
        { status: 400 }
      );
    }

    // Get the slot to verify the current user is the host
    const slot = await getSlotById(booking.slotId);
    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (slot.hostEmail.toLowerCase() !== hostEmail) {
      return NextResponse.json(
        { error: 'You are not the host of this slot' },
        { status: 403 }
      );
    }

    // Get the applicant's application (if they have one)
    let applicationId: string | undefined;
    if (booking.applicantEmail) {
      const application = await getApplicationByUser(booking.cycleId, booking.applicantEmail);
      applicationId = application?._id;
    }

    // Upsert the referral
    await upsertCoffeeChatReferral({
      cycleId: booking.cycleId,
      bookingId: booking._id!,
      slotId: booking.slotId,
      applicationId,
      applicantEmail: booking.applicantEmail || booking.userId,
      applicantName: booking.applicantName,
      hostEmail,
      hostName,
      signal,
      notes: notes || undefined,
    });

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      hostEmail,
      'content.updated',
      'CoffeeChatReferral',
      {
        targetId: bookingId,
        meta: {
          bookingId,
          applicantEmail: booking.applicantEmail || booking.userId,
          signal,
          slotId: booking.slotId,
        },
      }
    );

    return NextResponse.json({ 
      success: true,
      message: `Referral saved: ${signal}`,
    });
  } catch (error: any) {
    console.error('Error saving coffee chat referral:', error);
    return NextResponse.json(
      { error: 'Failed to save referral' }, 
      { status: 500 }
    );
  }
}
