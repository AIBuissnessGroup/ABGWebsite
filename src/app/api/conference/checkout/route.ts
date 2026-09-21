import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { 
  canPurchaseTickets, 
  getVerifiedPriceCents, 
  getVerifiedTierName 
} from '@/lib/conference-pricing';
import { checkRateLimit, sanitizeStringInput } from '@/lib/conference-security';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting (10 attempts per minute per IP)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = checkRateLimit(`checkout_${ip}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawName = body.name;
    const rawEmail = body.email;
    const rawAffiliation = body.affiliation;
    const rawDiet = body.dietaryRestrictions;

    // 2. Validate and sanitize inputs
    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
      return NextResponse.json(
        { error: 'Please provide the attendee full name.' },
        { status: 400 }
      );
    }

    const name = sanitizeStringInput(rawName, 100);
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const email = sanitizeStringInput(rawEmail, 254).toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address for ticket delivery.' },
        { status: 400 }
      );
    }

    const affiliation = sanitizeStringInput(rawAffiliation || 'other', 50);
    const dietaryRestrictions = sanitizeStringInput(rawDiet || '', 200);

    // 3. Strict server-side cutoff check
    if (!canPurchaseTickets()) {
      return NextResponse.json(
        { error: 'Ticket sales for the Michigan AI Business Conference have concluded.' },
        { status: 400 }
      );
    }

    // 4. Compute server-verified pricing and tier
    const priceInCents = getVerifiedPriceCents();
    const tierName = getVerifiedTierName();

    // 5. Check for signed-in user session to link ticket
    const session = await getServerSession(authOptions).catch(() => null);
    const userEmail = session?.user?.email ? sanitizeStringInput(session.user.email, 254).toLowerCase() : '';

    // 6. Determine host URL for redirects
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3001';

    // 7. Initialize Stripe
    let stripe;
    try {
      stripe = getStripe();
    } catch (stripeErr: any) {
      console.error('Stripe initialization error:', stripeErr.message);
      return NextResponse.json(
        { 
          error: 'Stripe payments are not yet configured on this server. Please ensure STRIPE_SECRET_KEY is set in .env.local.' 
        },
        { status: 503 }
      );
    }

    // 8. Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceInCents,
            product_data: {
              name: `Michigan AI Business Conference 2026 - ${tierName}`,
              description: 'Full-day access to keynote speakers, expert panels, case workshops, and networking reception at Stephen M. Ross School of Business on Friday, October 23, 2026.',
              images: [
                'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1200&auto=format&fit=crop'
              ],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: 'michigan-ai-conference-2026',
        tierName,
        attendeeName: name,
        attendeeEmail: email,
        affiliation,
        dietaryRestrictions,
        userEmail,
      },
      success_url: `${origin}/conference/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/conference#tickets`,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Stripe checkout' },
      { status: 500 }
    );
  }
}
