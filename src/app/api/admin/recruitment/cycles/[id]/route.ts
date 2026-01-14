/**
 * Recruitment Cycle by ID API
 * GET - Get a specific cycle
 * PUT - Update a cycle
 * DELETE - Delete a cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getCycleById, updateCycle, setActiveCycle, deleteCycle, getApplicationsByCycle } from '@/lib/recruitment/db';
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

    const cycle = await getCycleById(id);
    
    if (!cycle) {
      return corsResponse(NextResponse.json({ error: 'Cycle not found' }, { status: 404 }));
    }

    return corsResponse(NextResponse.json(cycle));
  } catch (error) {
    console.error('Error fetching recruitment cycle:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch cycle' }, { status: 500 })
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

    // Check if cycle exists first
    const existingCycle = await getCycleById(id);
    if (!existingCycle) {
      return corsResponse(NextResponse.json({ error: 'Cycle not found' }, { status: 404 }));
    }

    const data = await request.json();

    // Handle date conversions
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) {
      updateData.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    if (data.portalOpenAt !== undefined) updateData.portalOpenAt = new Date(data.portalOpenAt);
    if (data.portalCloseAt !== undefined) updateData.portalCloseAt = new Date(data.portalCloseAt);
    if (data.applicationDueAt !== undefined) updateData.applicationDueAt = new Date(data.applicationDueAt);
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await updateCycle(id, updateData);
    
    // If setting this cycle to active, deactivate others
    if (data.isActive === true) {
      await setActiveCycle(id);
    }

    // Fetch updated cycle
    const updatedCycle = await getCycleById(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.updated',
      'RecruitmentCycle',
      {
        targetId: id,
        meta: {
          cycleName: existingCycle.name,
          updatedFields: Object.keys(updateData),
        },
      }
    );

    return corsResponse(NextResponse.json(updatedCycle));
  } catch (error) {
    console.error('Error updating recruitment cycle:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to update cycle' }, { status: 500 })
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

    // Check if cycle exists
    const cycle = await getCycleById(id);
    if (!cycle) {
      return corsResponse(NextResponse.json({ error: 'Cycle not found' }, { status: 404 }));
    }

    // Check if cycle has any applications
    const applications = await getApplicationsByCycle(id);
    const hasApplications = applications.length > 0;

    if (hasApplications) {
      return corsResponse(
        NextResponse.json(
          { error: 'Cannot delete cycle with existing applications' },
          { status: 400 }
        )
      );
    }

    // Delete the cycle
    await deleteCycle(id);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.deleted',
      'RecruitmentCycle',
      {
        targetId: id,
        meta: {
          cycleName: cycle.name,
          slug: cycle.slug,
        },
      }
    );

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting recruitment cycle:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to delete cycle' }, { status: 500 })
    );
  }
}
