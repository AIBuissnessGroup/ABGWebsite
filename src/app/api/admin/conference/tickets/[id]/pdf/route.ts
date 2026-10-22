import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket } from '@/types/conference-ticket';
import { sanitizeStringInput } from '@/lib/conference-security';
import { buildConferenceTicketPdf } from '@/lib/conference-ticket-pdf';

export const dynamic = 'force-dynamic';

// Admin-only: download an attendee's pass as a PDF (to send to them directly)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.roles || [])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const ticketId = sanitizeStringInput(id, 50);
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const db = await getDb();
    const ticket = await db
      .collection<ConferenceTicket>('ConferenceTickets')
      .findOne({ $or: [{ id: ticketId }, { ticketCode: ticketId.toUpperCase() }] });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const pdf = await buildConferenceTicketPdf(ticket);
    const safeName = (ticket.attendeeName || 'attendee').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${ticket.ticketCode}-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    return NextResponse.json({ error: 'Failed to generate ticket PDF' }, { status: 500 });
  }
}
