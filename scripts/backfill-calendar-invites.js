#!/usr/bin/env node
/**
 * Backfill Google Calendar invites for all recruitment bookings missing them
 * Uses native Node.js fetch (no googleapis package required)
 * Usage: node scripts/backfill-calendar-invites.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Error: Google Calendar credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) not set.');
    process.exit(1);
  }

  // 1. Authenticate with Google via native fetch
  console.log('🔑 Authenticating with Google OAuth...');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error('❌ Failed to obtain Google access token:', tokenData);
    process.exit(1);
  }

  const accessToken = tokenData.access_token;
  console.log('✅ Google Authentication successful!\n');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();

    // 2. Find confirmed bookings without a calendarEventId
    const bookings = await db.collection('recruitment_bookings').find({
      status: { $ne: 'cancelled' },
      $or: [
        { calendarEventId: { $exists: false } },
        { calendarEventId: null },
        { calendarEventId: '' }
      ]
    }).toArray();

    console.log(`\n🔍 Found ${bookings.length} bookings missing calendar invites.\n`);

    if (bookings.length === 0) {
      console.log('🎉 All bookings already have calendar invites!');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      const num = `[${i + 1}/${bookings.length}]`;

      // Fetch slot details
      let slotIdObj = null;
      try { slotIdObj = new ObjectId(booking.slotId); } catch (e) {}

      const slot = await db.collection('recruitment_slots').findOne({
        $or: [{ _id: booking.slotId }, { _id: slotIdObj }].filter(Boolean)
      });

      if (!slot) {
        console.log(`⚠️ ${num} Slot not found for booking ID: ${booking._id}, skipping.`);
        skipCount++;
        continue;
      }

      if (!slot.hostEmail) {
        console.log(`⚠️ ${num} Host email missing for slot (${slot.hostName}), skipping.`);
        skipCount++;
        continue;
      }

      if (!booking.applicantEmail) {
        console.log(`⚠️ ${num} Applicant email missing for booking (${booking.applicantName}), skipping.`);
        skipCount++;
        continue;
      }

      const slotKindLabel = slot.kind === 'coffee_chat' ? 'Coffee Chat' : slot.kind.replace('_', ' ');
      const applicantName = booking.applicantName || booking.applicantEmail.split('@')[0];
      const startTime = new Date(slot.startTime);
      const endTime = slot.endTime 
        ? new Date(slot.endTime) 
        : new Date(startTime.getTime() + (slot.durationMinutes || 30) * 60000);

      const eventPayload = {
        summary: `ABG ${slotKindLabel}: ${applicantName} & ${slot.hostName}`,
        description: `${slotKindLabel} between ${applicantName} and ${slot.hostName} for ABG Recruitment.\n\n${slot.meetingUrl ? `Join meeting: ${slot.meetingUrl}` : ''}`.trim(),
        location: slot.location || slot.meetingUrl || 'TBD',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Detroit',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Detroit',
        },
        attendees: [
          { email: booking.applicantEmail.trim(), displayName: applicantName },
          { email: slot.hostEmail.trim(), displayName: slot.hostName },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      try {
        const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        const calData = await calRes.json();

        if (!calRes.ok || calData.error) {
          throw new Error(calData.error?.message || JSON.stringify(calData));
        }

        // Save to database
        await db.collection('recruitment_bookings').updateOne(
          { _id: booking._id },
          {
            $set: {
              calendarEventId: calData.id,
              calendarEventLink: calData.htmlLink,
              updatedAt: new Date().toISOString(),
            }
          }
        );

        console.log(`✅ ${num} Created: ${applicantName} with ${slot.hostName} (${startTime.toLocaleDateString()})`);
        successCount++;

        // Rate-limiting pause (400ms between calls)
        await new Promise(r => setTimeout(r, 400));
      } catch (err) {
        console.error(`❌ ${num} Failed for ${applicantName} & ${slot.hostName}:`, err.message);
        failCount++;
      }
    }

    console.log('\n==========================================');
    console.log(`🎯 Backfill Complete!`);
    console.log(`   ✅ Successfully Created: ${successCount}`);
    console.log(`   ⚠️ Skipped (missing data): ${skipCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('==========================================\n');

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await client.close();
  }
}

main();
