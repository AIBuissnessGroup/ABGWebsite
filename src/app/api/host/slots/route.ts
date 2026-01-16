/**
 * Host Slots API
 * GET - Get slots for the current user (host)
 * 
 * This endpoint allows slot hosts to view their slots and who has signed up
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getSlotsByHostEmail,
  getBookingsBySlot,
  getActiveCycle,
} from '@/lib/recruitment/db';
import type { RecruitmentSlot, SlotBooking } from '@/types/recruitment';

interface SlotWithBookings extends RecruitmentSlot {
  bookings: SlotBooking[];
  availableSpots: number;
}

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
    
    // If no cycleId specified, try to get active cycle
    if (!cycleId) {
      const activeCycle = await getActiveCycle();
      cycleId = activeCycle?._id || null;
    }

    // Get slots where this user is the host
    const slots = await getSlotsByHostEmail(hostEmail, cycleId || undefined);

    if (slots.length === 0) {
      return NextResponse.json({ 
        slots: [], 
        isHost: false,
        message: 'You are not a host for any slots' 
      });
    }

    // Enrich slots with booking information
    const slotsWithBookings: SlotWithBookings[] = await Promise.all(
      slots.map(async (slot) => {
        const bookings = await getBookingsBySlot(slot._id!);
        // Only include confirmed bookings (exclude cancelled)
        const activeBookings = bookings.filter(b => b.status !== 'cancelled');
        
        return {
          ...slot,
          bookings: activeBookings,
          availableSpots: slot.maxBookings - activeBookings.length,
        };
      })
    );

    return NextResponse.json({ 
      slots: slotsWithBookings, 
      isHost: true,
      hostEmail 
    });
  } catch (error) {
    console.error('Error fetching host slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' }, 
      { status: 500 }
    );
  }
}
