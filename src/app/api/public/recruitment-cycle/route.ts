/**
 * Public API to get active recruitment cycle info
 * Returns basic cycle info including deadline for homepage display
 */

import { NextResponse } from 'next/server';
import { getActiveCycle, getUpcomingCycle } from '@/lib/recruitment/db';

export async function GET() {
  try {
    // Get active cycle
    const cycle = await getActiveCycle();
    
    if (cycle) {
      return NextResponse.json({
        isActive: true,
        cycleName: cycle.name,
        portalOpenAt: cycle.portalOpenAt,
        portalCloseAt: cycle.portalCloseAt,
        applicationDueAt: cycle.applicationDueAt,
        portalUrl: '/portal',
      });
    }

    // Check for upcoming cycle
    const upcomingCycle = await getUpcomingCycle();
    
    if (upcomingCycle) {
      return NextResponse.json({
        isActive: false,
        isUpcoming: true,
        cycleName: upcomingCycle.name,
        portalOpenAt: upcomingCycle.portalOpenAt,
        portalCloseAt: upcomingCycle.portalCloseAt,
        applicationDueAt: upcomingCycle.applicationDueAt,
        portalUrl: '/portal',
      });
    }

    // No active or upcoming cycle
    return NextResponse.json({
      isActive: false,
      isUpcoming: false,
      message: 'No active recruitment cycle',
    });
  } catch (error) {
    console.error('Error fetching recruitment cycle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recruitment cycle info' },
      { status: 500 }
    );
  }
}
