import { TicketPricingStatus, TicketPricingPhase } from '@/types/conference-ticket';

// Milestones in America/New_York (EDT = UTC-4)
// Early bird ends at midnight starting Mon, Sep 21, 2026
export const EARLY_BIRD_END_ISO = '2026-09-21T00:00:00-04:00';
export const SALES_CLOSE_ISO = '2026-10-22T08:00:00-04:00';
export const CONFERENCE_START_ISO = '2026-10-23T08:30:00-04:00';

export const EARLY_BIRD_END_TIMESTAMP = new Date(EARLY_BIRD_END_ISO).getTime();
export const SALES_CLOSE_TIMESTAMP = new Date(SALES_CLOSE_ISO).getTime();
export const CONFERENCE_START_TIMESTAMP = new Date(CONFERENCE_START_ISO).getTime();

export const EARLY_BIRD_PRICE = 13; // $13.00 USD
export const EARLY_BIRD_PRICE_CENTS = 1300;

export const GENERAL_PRICE = 17; // $17.00 USD
export const GENERAL_PRICE_CENTS = 1700;

/**
 * Calculates current pricing status, tier, deadlines, and active availability
 */
export function getConferenceTicketStatus(nowMs: number = Date.now()): TicketPricingStatus {
  // Check if ticket sales have concluded
  if (nowMs >= SALES_CLOSE_TIMESTAMP) {
    return {
      phase: 'CLOSED',
      isAvailable: false,
      price: GENERAL_PRICE,
      priceInCents: GENERAL_PRICE_CENTS,
      priceLabel: `$${GENERAL_PRICE}`,
      tierName: 'Registration Closed',
      deadlineLabel: 'Concluded on Thu, Oct 22, 2026 at 8:00 AM EDT',
      deadlineTimestamp: SALES_CLOSE_TIMESTAMP,
      salesCloseTimestamp: SALES_CLOSE_TIMESTAMP,
      message: 'Ticket sales for the Michigan AI Business Conference 2026 have ended. On-site registration is not guaranteed.',
    };
  }

  // Check if Early Bird is still active
  if (nowMs < EARLY_BIRD_END_TIMESTAMP) {
    return {
      phase: 'EARLY_BIRD',
      isAvailable: true,
      price: EARLY_BIRD_PRICE,
      priceInCents: EARLY_BIRD_PRICE_CENTS,
      priceLabel: `$${EARLY_BIRD_PRICE}`,
      regularPriceLabel: `$${GENERAL_PRICE}`,
      tierName: 'Early Bird Pass',
      discountNote: 'Save $4 before Mon, Sep 21',
      deadlineLabel: 'Early Bird pricing ends Sun, Sep 20 at 11:59 PM EDT',
      deadlineTimestamp: EARLY_BIRD_END_TIMESTAMP,
      salesCloseTimestamp: SALES_CLOSE_TIMESTAMP,
      message: 'Exclusive early registration pricing. Full conference access included.',
    };
  }

  // General Admission window
  return {
    phase: 'GENERAL',
    isAvailable: true,
    price: GENERAL_PRICE,
    priceInCents: GENERAL_PRICE_CENTS,
    priceLabel: `$${GENERAL_PRICE}`,
    tierName: 'General Admission',
    deadlineLabel: 'Sales close Thu, Oct 22, 2026 at 8:00 AM EDT',
    deadlineTimestamp: SALES_CLOSE_TIMESTAMP,
    salesCloseTimestamp: SALES_CLOSE_TIMESTAMP,
    message: 'Full day access to keynotes, workshops, and networking reception.',
  };
}

/**
 * Validates that tickets can currently be purchased
 */
export function canPurchaseTickets(nowMs: number = Date.now()): boolean {
  return nowMs < SALES_CLOSE_TIMESTAMP;
}

/**
 * Returns the exact server-enforced price in cents
 */
export function getVerifiedPriceCents(nowMs: number = Date.now()): number {
  if (nowMs >= SALES_CLOSE_TIMESTAMP) {
    throw new Error('Ticket sales have concluded for this event.');
  }
  if (nowMs < EARLY_BIRD_END_TIMESTAMP) {
    return EARLY_BIRD_PRICE_CENTS;
  }
  return GENERAL_PRICE_CENTS;
}

/**
 * Returns the exact tier name for metadata & tickets
 */
export function getVerifiedTierName(nowMs: number = Date.now()): 'Early Bird Pass' | 'General Admission' {
  if (nowMs >= SALES_CLOSE_TIMESTAMP) {
    throw new Error('Ticket sales have concluded for this event.');
  }
  if (nowMs < EARLY_BIRD_END_TIMESTAMP) {
    return 'Early Bird Pass';
  }
  return 'General Admission';
}
