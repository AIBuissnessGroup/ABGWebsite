import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getAuditLogs, getAuditStats, getRequestMetadata } from '@/lib/audit';

// GET - Fetch audit logs and statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Get session with Next.js 15 compatibility
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const getStats = searchParams.get('stats') === 'true';

    if (getStats) {
      // Return statistics
      const stats = await getAuditStats();
      return NextResponse.json(stats);
    }

    // Return filtered logs
    const result = await getAuditLogs({
      page,
      limit,
      action,
      userEmail,
      targetType
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
} 