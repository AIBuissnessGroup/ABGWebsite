import type { Session } from 'next-auth';
import { getDb } from './mongodb';
import { isAdmin } from './roles';
import { getConferenceData } from './site-content/conference';
import { ConferenceTicket } from '@/types/conference-ticket';

// Check-in staff access lasts through the end of conference day (Fri Oct 23, 11:59 PM EDT)
export const CHECKIN_STAFF_ACCESS_ENDS = new Date('2026-10-24T04:00:00Z').getTime();

export type CheckinAccess = { allowed: true; role: 'admin' | 'staff'; email: string } | { allowed: false; reason: string };

// Admins always have access; people on the conference's check-in staff list have it until the day ends
export async function getCheckinAccess(session: Session | null): Promise<CheckinAccess> {
  const email = session?.user?.email?.toLowerCase();
  if (!email) return { allowed: false, reason: 'Sign in required' };
  if (isAdmin(session?.user?.roles || [])) return { allowed: true, role: 'admin', email };

  const data = await getConferenceData();
  const onList = (data.checkinStaff || []).some((s) => s.email.toLowerCase() === email);
  if (!onList) return { allowed: false, reason: 'Not on the check-in staff list' };
  if (Date.now() >= CHECKIN_STAFF_ACCESS_ENDS) return { allowed: false, reason: 'Check-in staff access has ended' };
  return { allowed: true, role: 'staff', email };
}

type CheckinResult = { status: number; body: Record<string, unknown> };

// Shared by the admin roster and the check-in page. Only flips an unchecked pass, so two people
// scanning the same attendee can't both check them in, and refunded/cancelled passes are refused.
export async function setTicketCheckIn(ticketId: string, checkedIn: boolean, by: string): Promise<CheckinResult> {
  const db = await getDb();
  const tickets = db.collection<ConferenceTicket>('ConferenceTickets');

  const ticket = await tickets.findOne({ $or: [{ id: ticketId }, { ticketCode: ticketId.toUpperCase() }] });
  if (!ticket) return { status: 404, body: { error: 'Ticket not found' } };

  if (!checkedIn) {
    await tickets.updateOne({ id: ticket.id }, { $set: { checkedIn: false, updatedAt: Date.now() }, $unset: { checkedInAt: '', checkedInBy: '' } });
    return { status: 200, body: { success: true, checkedIn: false } };
  }

  if (ticket.status !== 'confirmed') {
    return { status: 409, body: { error: `This pass is ${ticket.status} and can't be checked in` } };
  }

  const now = Date.now();
  const result = await tickets.updateOne(
    { id: ticket.id, checkedIn: { $ne: true } },
    { $set: { checkedIn: true, checkedInAt: now, checkedInBy: by, updatedAt: now } }
  );
  if (result.modifiedCount === 0) {
    const current = await tickets.findOne({ id: ticket.id });
    return {
      status: 200,
      body: { success: true, checkedIn: true, alreadyCheckedIn: true, checkedInAt: current?.checkedInAt ?? null, checkedInBy: current?.checkedInBy ?? null },
    };
  }
  return { status: 200, body: { success: true, checkedIn: true, checkedInAt: now, checkedInBy: by } };
}
