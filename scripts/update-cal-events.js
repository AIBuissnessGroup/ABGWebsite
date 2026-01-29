#!/usr/bin/env node
/**
 * Update Google Calendar events for round 2 interviews to correct date (Jan 28)
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const { google } = require('googleapis');
const path = require('path');

async function updateCalendarEvents() {
  // Setup MongoDB
  const client = new MongoClient(process.env.DATABASE_URL, {
    tls: true,
    tlsCAFile: path.join(__dirname, '..', 'global-bundle.pem'),
  });
  
  // Setup Google Calendar
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    await client.connect();
    const db = client.db('abg-website');
    
    // Get all round 2 bookings with calendar events
    const bookings = await db.collection('recruitment_bookings').find({
      slotKind: 'interview_round2',
      calendarEventId: { $exists: true, $ne: null }
    }).toArray();
    
    console.log('Found', bookings.length, 'bookings to update');
    
    let updated = 0;
    let failed = 0;
    
    for (const booking of bookings) {
      try {
        // Get the slot to get correct times
        const slot = await db.collection('recruitment_slots').findOne({
          _id: typeof booking.slotId === 'string' ? new ObjectId(booking.slotId) : booking.slotId
        });
        
        if (!slot) {
          console.log('Slot not found for booking:', booking._id);
          failed++;
          continue;
        }
        
        // Update the calendar event with the correct times
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: booking.calendarEventId,
          requestBody: {
            start: { 
              dateTime: slot.startTime, 
              timeZone: 'America/Detroit' 
            },
            end: { 
              dateTime: slot.endTime, 
              timeZone: 'America/Detroit' 
            },
          },
          sendUpdates: 'all', // Notify attendees of the update
        });
        
        console.log('✅ Updated:', booking.applicantEmail, '-', slot.hostName, '@', new Date(slot.startTime).toLocaleString('en-US', { timeZone: 'America/Detroit' }));
        updated++;
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
        
      } catch (error) {
        console.log('❌ Failed:', booking.applicantEmail, '-', error.message);
        failed++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('Updated:', updated);
    console.log('Failed:', failed);
    
  } finally {
    await client.close();
  }
}

updateCalendarEvents();
