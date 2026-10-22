import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket } from '@/types/conference-ticket';
import { escapeRegex, sanitizeStringInput } from '@/lib/conference-security';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.roles || [])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const rawEntries = Array.isArray(body.entries) ? body.entries : [];
    const defaultAffiliation = sanitizeStringInput(body.affiliation || 'other', 50);

    if (rawEntries.length === 0) {
      return NextResponse.json({ error: 'No attendee entries provided' }, { status: 400 });
    }

    if (rawEntries.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 entries can be imported at once' }, { status: 400 });
    }

    const db = await getDb();
    const ticketsCollection = db.collection<ConferenceTicket>('ConferenceTickets');

    const imported: Array<{ name: string; email?: string; ticketCode: string }> = [];
    const skipped: Array<{ name: string; email?: string; reason: string; ticketCode?: string }> = [];
    const errors: Array<{ name: string; email?: string; error: string }> = [];

    // Track used codes and names/emails within this current batch to avoid in-batch collisions
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();

    for (const entry of rawEntries) {
      const firstName = sanitizeStringInput(entry.firstName || entry.first || '', 50);
      const lastName = sanitizeStringInput(entry.lastName || entry.last || '', 50);
      const rawFullName = sanitizeStringInput(entry.name || `${firstName} ${lastName}`.trim(), 100);

      if (!rawFullName || rawFullName.length < 2) {
        errors.push({ name: rawFullName || '(Blank Name)', email: entry.email, error: 'Name is required (min 2 characters)' });
        continue;
      }

      const attendeeName = rawFullName;
      const rawEmail = sanitizeStringInput(entry.email || '', 254).toLowerCase();
      let attendeeEmail = '';

      if (rawEmail) {
        if (!EMAIL_REGEX.test(rawEmail)) {
          errors.push({ name: attendeeName, email: rawEmail, error: 'Invalid email address format' });
          continue;
        }
        attendeeEmail = rawEmail;
      }

      // Check within current batch for duplicates
      if (attendeeEmail && seenEmails.has(attendeeEmail)) {
        skipped.push({ name: attendeeName, email: attendeeEmail, reason: 'Duplicate in CSV file' });
        continue;
      }
      if (!attendeeEmail && seenNames.has(attendeeName.toLowerCase())) {
        skipped.push({ name: attendeeName, email: '', reason: 'Duplicate name in CSV file' });
        continue;
      }

      // Check database for existing confirmed ticket
      const existingTicket = attendeeEmail
        ? await ticketsCollection.findOne({ attendeeEmail, status: 'confirmed' })
        : await ticketsCollection.findOne({
            attendeeName: { $regex: `^${escapeRegex(attendeeName)}$`, $options: 'i' },
            status: 'confirmed',
          });

      if (existingTicket) {
        skipped.push({
          name: attendeeName,
          email: attendeeEmail,
          reason: `Already on roster (${existingTicket.ticketCode})`,
          ticketCode: existingTicket.ticketCode,
        });
        if (attendeeEmail) seenEmails.add(attendeeEmail);
        else seenNames.add(attendeeName.toLowerCase());
        continue;
      }

      // Generate unique random 4-digit ticket code
      let randomCode = crypto.randomInt(1000, 9999);
      for (let attempt = 0; attempt < 20; attempt++) {
        const codeStr = `MAIC-${randomCode}`;
        const taken = await ticketsCollection.findOne({ ticketCode: codeStr });
        if (!taken) break;
        randomCode = crypto.randomInt(1000, 9999);
      }

      const now = Date.now();
      const ticketDoc: ConferenceTicket = {
        id: `TKT-${now.toString(36).toUpperCase()}-${randomCode}`,
        ticketCode: `MAIC-${randomCode}`,
        stripeSessionId: `bulk_csv_${crypto.randomUUID()}`,
        attendeeName,
        attendeeEmail,
        affiliation: sanitizeStringInput(entry.affiliation || defaultAffiliation || 'other', 50),
        tier: 'Complimentary',
        amountPaid: 0,
        currency: 'usd',
        status: 'confirmed',
        checkedIn: false,
        checkInToken: crypto.randomUUID(),
        issuedBy: session.user?.email || 'admin',
        createdAt: now,
        updatedAt: now,
      };

      await ticketsCollection.insertOne(ticketDoc as any);

      if (attendeeEmail) seenEmails.add(attendeeEmail);
      else seenNames.add(attendeeName.toLowerCase());

      imported.push({
        name: attendeeName,
        email: attendeeEmail,
        ticketCode: ticketDoc.ticketCode,
      });
    }

    console.log(`✅ Bulk CSV import completed: ${imported.length} created, ${skipped.length} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      total: rawEntries.length,
      importedCount: imported.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      imported,
      skipped,
      errors,
    });
  } catch (error: any) {
    console.error('Error in bulk tickets import API:', error);
    return NextResponse.json({ error: error.message || 'Failed to import tickets' }, { status: 500 });
  }
}
