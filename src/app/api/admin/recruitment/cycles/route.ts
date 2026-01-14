/**
 * Recruitment Cycles API
 * GET - List all cycles
 * POST - Create a new cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getCycles, createCycle, setActiveCycle, getCycleById } from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { RecruitmentCycle, CycleSettings } from '@/types/recruitment';

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const cycles = await getCycles();
    return corsResponse(NextResponse.json(cycles));
  } catch (error) {
    console.error('Error fetching recruitment cycles:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch cycles' }, { status: 500 })
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
    if (!data.slug || !data.name) {
      return corsResponse(
        NextResponse.json({ error: 'Slug and name are required' }, { status: 400 })
      );
    }

    // Validate dates
    if (!data.portalOpenAt || !data.portalCloseAt || !data.applicationDueAt) {
      return corsResponse(
        NextResponse.json({ error: 'All dates are required' }, { status: 400 })
      );
    }

    const defaultSettings: CycleSettings = {
      requireResume: true,
      requireHeadshot: true,
      allowTrackChange: false,
    };

    const cycleData: Omit<RecruitmentCycle, '_id' | 'createdAt' | 'updatedAt'> = {
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: data.name,
      isActive: data.isActive || false,
      portalOpenAt: new Date(data.portalOpenAt),
      portalCloseAt: new Date(data.portalCloseAt),
      applicationDueAt: new Date(data.applicationDueAt),
      settings: { ...defaultSettings, ...data.settings },
    };

    const cycleId = await createCycle(cycleData);

    // If this cycle is set to active, deactivate others
    if (data.isActive) {
      await setActiveCycle(cycleId);
    }

    // Fetch the created cycle
    const cycle = await getCycleById(cycleId);

    // Audit log
    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.created',
      'RecruitmentCycle',
      {
        targetId: cycleId,
        meta: {
          cycleName: cycle?.name,
          slug: cycle?.slug,
        },
      }
    );

    return corsResponse(NextResponse.json(cycle, { status: 201 }));
  } catch (error) {
    console.error('Error creating recruitment cycle:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to create cycle' }, { status: 500 })
    );
  }
}
