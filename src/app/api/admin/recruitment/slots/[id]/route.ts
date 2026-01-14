/**
 * Recruitment Slot by ID API
 * GET - Get a specific slot with bookings
 * PUT - Update a slot
 * DELETE - Delete a slot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getSlotById, 
  updateSlot, 
  deleteSlot,
  getBookingsBySlot,
  withConnection,
  COLLECTIONS,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';

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

    const slot = await getSlotById(id);
    
    if (!slot) {
      return corsResponse(NextResponse.json({ error: 'Slot not found' }, { status: 404 }));
    }

    // Include bookings
    const bookings = await getBookingsBySlot(id);

    return corsResponse(NextResponse.json({
      ...slot,
      bookings,
      bookedCount: bookings.length,
      availableSpots: slot.maxBookings - bookings.length,
    }));
  } catch (error) {
    console.error('Error fetching slot:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch slot' }, { status: 500 })
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

    // Check if slot exists first
    const existingSlot = await getSlotById(id);
    if (!existingSlot) {
      return corsResponse(NextResponse.json({ error: 'Slot not found' }, { status: 404 }));
    }

    const data = await request.json();

    // Build update data
    const updateData: any = {};
    
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl;
    if (data.hostName !== undefined) updateData.hostName = data.hostName;
    if (data.hostEmail !== undefined) updateData.hostEmail = data.hostEmail;
    if (data.maxBookings !== undefined) updateData.maxBookings = data.maxBookings;
    if (data.forTrack !== undefined) updateData.forTrack = data.forTrack;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await updateSlot(id, updateData);
    
    // Fetch updated slot
    const updatedSlot = await getSlotById(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.updated',
      'RecruitmentSlot',
      {
        targetId: id,
        meta: {
          kind: existingSlot.kind,
          updatedFields: Object.keys(updateData),
        },
      }
    );

    return corsResponse(NextResponse.json(updatedSlot));
  } catch (error) {
    console.error('Error updating slot:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
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

    // Check if slot exists
    const slot = await getSlotById(id);
    if (!slot) {
      return corsResponse(NextResponse.json({ error: 'Slot not found' }, { status: 404 }));
    }

    // Check for active bookings
    const bookings = await getBookingsBySlot(id);
    const activeBookings = bookings.filter(b => b.status === 'confirmed');
    
    if (activeBookings.length > 0) {
      return corsResponse(
        NextResponse.json(
          { error: 'Cannot delete slot with active bookings. Cancel bookings first.' },
          { status: 400 }
        )
      );
    }

    // Delete the slot and any cancelled bookings
    await withConnection(async (db) => {
      await db.collection(COLLECTIONS.BOOKINGS).deleteMany({ slotId: id });
    });
    await deleteSlot(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.deleted',
      'RecruitmentSlot',
      {
        targetId: id,
        meta: {
          kind: slot.kind,
          startTime: slot.startTime,
        },
      }
    );

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting slot:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
    );
  }
}
