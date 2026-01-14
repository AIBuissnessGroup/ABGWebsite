/**
 * Recruitment Slots API (Coffee Chats & Interviews)
 * GET - List slots for a cycle
 * POST - Create a new slot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getSlotsByCycle, 
  createSlot, 
  getCycleById,
  getBookingsBySlot,
  getSlotById,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { RecruitmentSlot, SlotKind } from '@/types/recruitment';

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
    const kind = searchParams.get('kind') as SlotKind | null;
    const includeBookings = searchParams.get('includeBookings') === 'true';

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    const slots = await getSlotsByCycle(cycleId, { kind: kind || undefined });

    // Optionally include booking information
    if (includeBookings) {
      const slotsWithBookings = await Promise.all(
        slots.map(async (slot) => {
          const bookings = await getBookingsBySlot(slot._id!);
          // Only count confirmed bookings (exclude cancelled)
          const activeBookings = bookings.filter(b => b.status !== 'cancelled');
          return {
            ...slot,
            bookings: activeBookings,
            bookedCount: activeBookings.length,
            availableSpots: slot.maxBookings - activeBookings.length,
          };
        })
      );
      return corsResponse(NextResponse.json(slotsWithBookings));
    }

    return corsResponse(NextResponse.json(slots));
  } catch (error) {
    console.error('Error fetching slots:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
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
    if (!data.cycleId || !data.kind || !data.startTime || !data.hostName || !data.hostEmail) {
      return corsResponse(
        NextResponse.json(
          { error: 'cycleId, kind, startTime, hostName, and hostEmail are required' },
          { status: 400 }
        )
      );
    }

    // Validate kind
    const validKinds: SlotKind[] = ['coffee_chat', 'interview_round1', 'interview_round2'];
    if (!validKinds.includes(data.kind)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid slot kind' }, { status: 400 })
      );
    }

    // Verify cycle exists
    const cycle = await getCycleById(data.cycleId);
    if (!cycle) {
      return corsResponse(
        NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
      );
    }

    const slotData: Omit<RecruitmentSlot, '_id' | 'createdAt' | 'updatedAt'> = {
      cycleId: data.cycleId,
      kind: data.kind,
      hostName: data.hostName,
      hostEmail: data.hostEmail,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes || 30,
      location: data.location,
      meetingUrl: data.meetingUrl,
      forTrack: data.forTrack,
      maxBookings: data.maxBookings || 1,
      bookedCount: 0,
      notes: data.notes,
    };

    const slotId = await createSlot(slotData);
    const slot = await getSlotById(slotId);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.created',
      'RecruitmentSlot',
      {
        targetId: slotId,
        meta: {
          kind: data.kind,
          startTime: data.startTime,
          hostEmail: data.hostEmail,
        },
      }
    );

    return corsResponse(NextResponse.json(slot, { status: 201 }));
  } catch (error) {
    console.error('Error creating slot:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to create slot' }, { status: 500 })
    );
  }
}
