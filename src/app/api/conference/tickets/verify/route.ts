import { NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getDb } from '@/lib/mongodb';
import { getStripe } from '@/lib/stripe';
import { ConferenceTicket } from '@/types/conference-ticket';
import { sendConferenceTicketEmail } from '@/lib/conference-email';
import { checkRateLimit, sanitizeStringInput } from '@/lib/conference-security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Rate limiting by IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = checkRateLimit(`verify_${ip}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const ticketId = searchParams.get('ticket_id');
    const checkInCode = searchParams.get('check_in_code');

    if (!sessionId && !ticketId && !checkInCode) {
      return NextResponse.json(
        { error: 'Missing session_id or authorization identifier' },
        { status: 400 }
      );
    }

    // 2. Validate session_id format if provided
    if (sessionId && (!sessionId.startsWith('cs_') || sessionId.length > 200)) {
      return NextResponse.json({ error: 'Invalid session identifier' }, { status: 400 });
    }

    // 3. Lookup by ticketId or checkInCode: MUST be authenticated as Admin or Ticket Owner
    // Perform authentication check FIRST before touching database to prevent unauthenticated enumeration & DB load
    let sessionUserEmail: string | null = null;
    let userIsAdmin = false;

    if (!sessionId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication required to look up ticket by code.' },
          { status: 401 }
        );
      }
      sessionUserEmail = session.user.email.toLowerCase();
      userIsAdmin = isAdmin(session.user?.roles || []);
    }

    const db = await getDb();
    const ticketsCollection = db.collection<ConferenceTicket>('ConferenceTickets');

    let ticket: ConferenceTicket | null = null;

    // 4. Lookup via secure cryptographically unguessable Stripe session_id
    if (sessionId) {

      ticket = await ticketsCollection.findOne({ stripeSessionId: sessionId });

      // If ticket is not in DB yet (webhook in-flight), verify directly with Stripe
      if (!ticket) {
        try {
          const stripe = getStripe();
          const session = await stripe.checkout.sessions.retrieve(sessionId);

          if (session && session.payment_status === 'paid') {
            const randomCode = crypto.randomInt(1000, 9999);
            const newTicketId = `TKT-${Date.now().toString(36).toUpperCase()}-${randomCode}`;
            const newTicketCode = `MAIC-${randomCode}`;
            const checkInToken = crypto.randomUUID();

            const attendeeName = sanitizeStringInput(
              session.metadata?.attendeeName || session.customer_details?.name || 'Valued Attendee',
              100
            );

            const attendeeEmail = sanitizeStringInput(
              (session.metadata?.attendeeEmail || session.customer_details?.email || '').trim().toLowerCase(),
              254
            );

            const tier =
              (session.metadata?.tierName as any) ||
              (session.amount_total === 1300 ? 'Early Bird Pass' : 'General Admission');

            const amountPaid = (session.amount_total || 0) / 100;

            const newTicket: ConferenceTicket = {
              id: newTicketId,
              ticketCode: newTicketCode,
              stripeSessionId: session.id,
              stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
              attendeeName,
              attendeeEmail,
              affiliation: sanitizeStringInput(session.metadata?.affiliation || 'other', 50),
              dietaryRestrictions: sanitizeStringInput(session.metadata?.dietaryRestrictions || '', 200),
              tier,
              amountPaid,
              currency: session.currency || 'usd',
              status: 'confirmed',
              checkedIn: false,
              checkInToken,
              userEmail: session.metadata?.userEmail ? sanitizeStringInput(session.metadata.userEmail, 254).toLowerCase() : undefined,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            await ticketsCollection.insertOne(newTicket as any);
            ticket = newTicket;

            // Dispatch confirmation email
            const origin = process.env.NEXTAUTH_URL || 'https://abgumich.org';
            sendConferenceTicketEmail(newTicket, origin).catch((e) => console.error(e));
          }
        } catch (stripeErr) {
          console.warn('Could not retrieve session from Stripe directly:', stripeErr);
        }
      }
    } else if (ticketId) {
      ticket = await ticketsCollection.findOne({ id: sanitizeStringInput(ticketId, 50) });
    } else if (checkInCode) {
      ticket = await ticketsCollection.findOne({ ticketCode: sanitizeStringInput(checkInCode, 20).toUpperCase() });
    }

    // 4. Check ownership or admin status if queried by ticketId/checkInCode
    if (!sessionId && ticket) {
      if (!userIsAdmin && ticket.attendeeEmail !== sessionUserEmail && ticket.userEmail !== sessionUserEmail) {
        return NextResponse.json(
          { error: 'You do not have permission to view this ticket.' },
          { status: 403 }
        );
      }
    }

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket pass not found or payment is still processing.' },
        { status: 404 }
      );
    }

    // Generate QR code data URL for client display
    const qrCodeDataUrl = await QRCode.toDataURL(ticket.checkInToken, {
      width: 320,
      margin: 2,
      color: {
        dark: '#00274c',
        light: '#ffffff',
      },
    });

    // SECURITY: Do not expose raw internal checkInToken in client JSON
    const { checkInToken: _, ...safeTicket } = ticket;

    return NextResponse.json({
      ticket: {
        ...safeTicket,
        qrCodeDataUrl,
      },
    });
  } catch (error: any) {
    console.error('Error verifying ticket:', error);
    return NextResponse.json(
      { error: 'Failed to verify ticket pass' },
      { status: 500 }
    );
  }
}
