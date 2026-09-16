export type TicketPricingPhase = 'EARLY_BIRD' | 'GENERAL' | 'CLOSED';

export interface TicketPricingStatus {
  phase: TicketPricingPhase;
  isAvailable: boolean;
  price: number; // in dollars (e.g. 13 or 17)
  priceInCents: number; // in cents (e.g. 1300 or 1700)
  priceLabel: string; // e.g. "$13"
  regularPriceLabel?: string; // e.g. "$17"
  tierName: string; // "Early Bird Pass" | "General Admission" | "Registration Closed"
  discountNote?: string; // "Save $4 before Sep 21"
  deadlineLabel: string; // human readable deadline
  deadlineTimestamp: number; // epoch ms for countdown timers
  salesCloseTimestamp: number; // Oct 22, 2026, 8:00 AM EDT in epoch ms
  message?: string;
}

export interface AttendeeInfo {
  name: string;
  email: string;
  affiliation?: 'umich_student' | 'umich_faculty' | 'alumni' | 'industry' | 'other';
  dietaryRestrictions?: string;
  notes?: string;
}

export interface ConferenceTicket {
  id: string; // internal ticket ID (e.g. TKT-ABC123XYZ)
  ticketCode: string; // short unique code for human/check-in use
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  attendeeName: string;
  attendeeEmail: string;
  affiliation?: string;
  dietaryRestrictions?: string;
  tier: 'Early Bird Pass' | 'General Admission';
  amountPaid: number; // in dollars (e.g. 13 or 17)
  currency: string; // 'usd'
  status: 'confirmed' | 'refunded' | 'cancelled';
  checkedIn: boolean;
  checkedInAt?: number;
  checkedInBy?: string;
  checkInToken: string; // secure hash/token encoded in QR code
  qrCodeDataUrl?: string; // Base64 data URL of the QR code image
  userEmail?: string; // matched Google login email if signed in
  createdAt: number;
  updatedAt: number;
}

export interface AdminTicketStats {
  totalTickets: number;
  grossRevenue: number;
  earlyBirdCount: number;
  generalCount: number;
  checkedInCount: number;
  pendingCheckInCount: number;
}
