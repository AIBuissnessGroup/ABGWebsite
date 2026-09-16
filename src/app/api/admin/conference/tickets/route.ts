import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket, AdminTicketStats } from '@/types/conference-ticket';
import { escapeRegex, sanitizeCsvCell, sanitizeStringInput } from '@/lib/conference-security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.roles || [])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const rawSearch = (searchParams.get('q') || '').trim();

    const db = await getDb();
    const ticketsCollection = db.collection<ConferenceTicket>('ConferenceTickets');

    // Filter by query if provided - SECURITY: Escape regex characters to prevent ReDoS
    let query: any = {};
    if (rawSearch) {
      const escaped = escapeRegex(rawSearch);
      query = {
        $or: [
          { attendeeName: { $regex: escaped, $options: 'i' } },
          { attendeeEmail: { $regex: escaped, $options: 'i' } },
          { ticketCode: { $regex: escaped, $options: 'i' } },
          { tier: { $regex: escaped, $options: 'i' } },
        ],
      };
    }

    const tickets = await ticketsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // If CSV download requested - SECURITY: Sanitize cells against formula injection
    if (format === 'csv') {
      const headers = [
        'Ticket Code',
        'Attendee Name',
        'Attendee Email',
        'Tier',
        'Affiliation',
        'Amount Paid ($)',
        'Status',
        'Checked In',
        'Checked In At',
        'Purchased Date',
      ];

      const rows = tickets.map((t) => [
        sanitizeCsvCell(t.ticketCode),
        sanitizeCsvCell(t.attendeeName),
        sanitizeCsvCell(t.attendeeEmail),
        sanitizeCsvCell(t.tier),
        sanitizeCsvCell(t.affiliation || 'other'),
        sanitizeCsvCell(t.amountPaid),
        sanitizeCsvCell(t.status),
        sanitizeCsvCell(t.checkedIn ? 'YES' : 'NO'),
        sanitizeCsvCell(t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('en-US') : ''),
        sanitizeCsvCell(new Date(t.createdAt).toLocaleString('en-US')),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="michigan-ai-conference-roster-${Date.now()}.csv"`,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Compute aggregated metrics
    const totalTickets = tickets.length;
    let grossRevenue = 0;
    let earlyBirdCount = 0;
    let generalCount = 0;
    let checkedInCount = 0;

    for (const t of tickets) {
      if (t.status === 'confirmed') {
        grossRevenue += t.amountPaid || 0;
      }
      if (t.tier === 'Early Bird Pass') {
        earlyBirdCount++;
      } else {
        generalCount++;
      }
      if (t.checkedIn) {
        checkedInCount++;
      }
    }

    const stats: AdminTicketStats = {
      totalTickets,
      grossRevenue,
      earlyBirdCount,
      generalCount,
      checkedInCount,
      pendingCheckInCount: totalTickets - checkedInCount,
    };

    return NextResponse.json({ stats, tickets });
  } catch (error: any) {
    console.error('Error in admin tickets API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.roles || [])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const rawTicketId = body.ticketId;
    const checkedIn = body.checkedIn;

    if (!rawTicketId || typeof rawTicketId !== 'string' || typeof checkedIn !== 'boolean') {
      return NextResponse.json({ error: 'Valid ticketId and checkedIn status required' }, { status: 400 });
    }

    const ticketId = sanitizeStringInput(rawTicketId, 50);

    const db = await getDb();
    const ticketsCollection = db.collection<ConferenceTicket>('ConferenceTickets');

    const updateDoc: any = {
      checkedIn,
      updatedAt: Date.now(),
    };

    if (checkedIn) {
      updateDoc.checkedInAt = Date.now();
      updateDoc.checkedInBy = session.user?.email || 'admin';
    } else {
      updateDoc.checkedInAt = null;
      updateDoc.checkedInBy = null;
    }

    const result = await ticketsCollection.updateOne(
      { $or: [{ id: ticketId }, { ticketCode: ticketId.toUpperCase() }] },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, checkedIn });
  } catch (error: any) {
    console.error('Error updating ticket check-in status:', error);
    return NextResponse.json({ error: 'Failed to update check-in status' }, { status: 500 });
  }
}
