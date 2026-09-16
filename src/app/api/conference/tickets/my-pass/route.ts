import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import QRCode from 'qrcode';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket } from '@/types/conference-ticket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ hasTicket: false, message: 'Not signed in' });
    }

    const email = session.user.email.toLowerCase();
    const db = await getDb();
    const ticketsCollection = db.collection<ConferenceTicket>('ConferenceTickets');

    // Find ticket by userEmail or attendeeEmail
    const ticket = await ticketsCollection.findOne(
      {
        $or: [{ userEmail: email }, { attendeeEmail: email }],
        status: 'confirmed',
      },
      { sort: { createdAt: -1 } }
    );

    if (!ticket) {
      return NextResponse.json({ hasTicket: false });
    }

    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(ticket.checkInToken, {
      width: 320,
      margin: 2,
      color: {
        dark: '#00274c',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      hasTicket: true,
      ticket: {
        ...ticket,
        qrCodeDataUrl,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user ticket pass:', error);
    return NextResponse.json({ hasTicket: false, error: 'Failed to look up ticket' });
  }
}
