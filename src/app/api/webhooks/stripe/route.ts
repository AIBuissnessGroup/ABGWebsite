import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket } from '@/types/conference-ticket';
import { sendConferenceTicketEmail } from '@/lib/conference-email';
import { sanitizeStringInput } from '@/lib/conference-security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // SECURITY: Mandatory signature verification in production and dev
  if (!webhookSecret) {
    console.error('❌ CRITICAL: STRIPE_WEBHOOK_SECRET is not configured. Webhooks are rejected for security.');
    return NextResponse.json(
      { error: 'Webhook secret is not configured on server' },
      { status: 500 }
    );
  }

  if (!signature) {
    console.warn('⚠️ Webhook request rejected: missing stripe-signature header.');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('❌ Stripe Webhook Signature Verification Failed:', err.message);
    return NextResponse.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 });
  }

  // Handle Checkout Session Completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Verify session is paid
    if (session.payment_status !== 'paid') {
      console.log(`ℹ️ Checkout session ${session.id} not yet marked as paid (status: ${session.payment_status})`);
      return NextResponse.json({ received: true });
    }

    try {
      const db = await getDb();
      const ticketsCollection = db.collection<ConferenceTicket>('ConferenceTickets');

      // Idempotency: check if ticket already recorded for this session
      const existingTicket = await ticketsCollection.findOne({ stripeSessionId: session.id });
      if (existingTicket) {
        console.log(`ℹ️ Ticket already recorded for Stripe session ${session.id}`);
        return NextResponse.json({ received: true, message: 'Ticket already recorded' });
      }

      // Generate human-friendly codes with cryptographically secure randomness
      const randomCode = crypto.randomInt(1000, 9999);
      const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${randomCode}`;
      const ticketCode = `MAIC-${randomCode}`;
      const checkInToken = crypto.randomUUID();

      const rawName = session.metadata?.attendeeName || session.customer_details?.name || 'Valued Attendee';
      const attendeeName = sanitizeStringInput(rawName, 100);

      const rawEmail = (session.metadata?.attendeeEmail || session.customer_details?.email || '').trim().toLowerCase();
      const attendeeEmail = sanitizeStringInput(rawEmail, 254);

      const rawAffiliation = session.metadata?.affiliation || 'other';
      const affiliation = sanitizeStringInput(rawAffiliation, 50);

      const rawDiet = session.metadata?.dietaryRestrictions || '';
      const dietaryRestrictions = sanitizeStringInput(rawDiet, 200);

      const tier =
        (session.metadata?.tierName as any) ||
        (session.amount_total === 1300 ? 'Early Bird Pass' : 'General Admission');

      const amountPaid = (session.amount_total || 0) / 100;

      const ticketDoc: ConferenceTicket = {
        id: ticketId,
        ticketCode,
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
        attendeeName,
        attendeeEmail,
        affiliation,
        dietaryRestrictions,
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

      await ticketsCollection.insertOne(ticketDoc as any);
      console.log(`✅ Saved conference ticket ${ticketDoc.ticketCode} for ${ticketDoc.attendeeEmail}`);

      // Dispatch confirmation email with QR code
      const origin = process.env.NEXTAUTH_URL || 'https://umichaibusiness.com';
      await sendConferenceTicketEmail(ticketDoc, origin).catch((emailErr) => {
        console.error('Failed to send ticket email:', emailErr);
      });

      return NextResponse.json({ received: true, ticketId: ticketDoc.id });
    } catch (dbErr: any) {
      console.error('Database error fulfilling Stripe ticket:', dbErr);
      return NextResponse.json({ error: 'Failed to record ticket in database' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
