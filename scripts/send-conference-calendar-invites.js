#!/usr/bin/env node
/**
 * Send Google Calendar Invites for Michigan AI Business Conference 2026
 *
 * Invites all confirmed ticket holders to the 7 conference events on Friday, October 23, 2026:
 *  1. 10:30 AM - 11:00 AM: Registration & Check-In
 *  2. 11:00 AM - 11:15 AM: Opening Remarks
 *  3. 11:15 AM - 12:15 PM: AI Inside the World's Biggest Banks and Funds
 *  4. 12:15 PM - 1:15 PM:  Lunch and Learn
 *  5.  1:15 PM - 2:15 PM:  Engineering the Future: AI at Microsoft's Core
 *  6.  3:45 PM - 4:30 PM:  Robertson Auditorium - From Pitch to Portfolio: Building and Funding the AI Wave
 *  7.  4:30 PM - 5:00 PM:  Closing Remarks & Networking
 *
 * Usage:
 *   node scripts/send-conference-calendar-invites.js
 *   node scripts/send-conference-calendar-invites.js --dry-run
 *   node scripts/send-conference-calendar-invites.js --paid-only
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');
const { google } = require('googleapis');

// ── 7 SESSIONS FOR FRIDAY, OCTOBER 23, 2026 (America/Detroit, EDT = UTC-4) ──
const CONFERENCE_EVENTS = [
  {
    id: 'arrival',
    summary: 'Registration & Arrival - Michigan AI Business Conference 2026',
    location: 'Stewart Lobby, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Arrival, registration, coffee cart (courtesy of Rambler), and red carpet photos!\n\nPlease have your digital ticket confirmation or QR code ready upon arrival at the Stewart Lobby registration table.\n\nMichigan AI Business Conference 2026\nHosted by University of Michigan AI Business Group (ABG)\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T10:30:00-04:00',
    endTime: '2026-10-23T11:00:00-04:00',
  },
  {
    id: 'opening',
    summary: 'Opening Remarks - Michigan AI Business Conference 2026',
    location: 'Blau Colloquium (5th Floor), Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Welcome and opening remarks given by ABG President Julia Lotz.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T11:00:00-04:00',
    endTime: '2026-10-23T11:15:00-04:00',
  },
  {
    id: 'banks-and-funds',
    summary: "AI Inside the World's Biggest Banks and Funds - Michigan AI Business Conference 2026",
    location: 'Blau Colloquium (5th Floor), Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      "Panel: AI Inside the World's Biggest Banks and Funds\n\nFeatured Speakers:\n• Julia Lynn (VP, Applied AI/ML Lead at JPMorgan)\n• Nikhil Pajankar (Senior Product Manager, Risk Analytics at Citi)\n• Kaylee Weil (AI Reverse Mentor & Chief People Org Analyst at Bank of America)\n\nAI is reshaping finance — from trading and risk management to fraud detection and customer experience. Hear from industry experts on where the technology is headed.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference",
    startTime: '2026-10-23T11:15:00-04:00',
    endTime: '2026-10-23T12:15:00-04:00',
  },
  {
    id: 'lunch-and-learn',
    summary: 'Lunch & Learn Sessions - Michigan AI Business Conference 2026',
    location: 'Rooms R2220 & R2230, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Catered lunch & learn breakout sessions:\n\n• Room R2220: Bitcoin 101 with Josh Spiewak (Managing Partner & COO at NorthStar Advisory Group) & Sloan Spiewak (ABG Portfolio Manager)\n• Room R2230: Building Your Professional Brand with Jacob Walker (Incoming Full-Time Analyst at BNY)\n\nEnjoy a catered lunch and join the discussion in either room!\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T12:15:00-04:00',
    endTime: '2026-10-23T13:15:00-04:00',
  },
  {
    id: 'microsoft-keynote',
    summary: "Keynote: Engineering the Future: AI at Microsoft's Core - Michigan AI Business Conference 2026",
    location: 'Robertson Auditorium, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      "Featured Keynote: Engineering the Future: AI at Microsoft's Core\n\nSpeaker:\n• Jennifer Marsman (Principal Engineer in AI, Office of the CTO at Microsoft)\nModerator:\n• Michael Speigl (Professor, Ross School of Business)\n\nA deep dive into AI in the world of technology from Jennifer Marsman.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference",
    startTime: '2026-10-23T13:15:00-04:00',
    endTime: '2026-10-23T14:15:00-04:00',
  },
  {
    id: 'pitch-to-portfolio',
    summary: 'From Pitch to Portfolio: Building and Funding the AI Wave - Michigan AI Business Conference 2026',
    location: 'Robertson Auditorium, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Panel: From Pitch to Portfolio: Building and Funding the AI Wave\n\nFeatured Speakers:\n• Lindsey Kilbride (Principal at Detroit Venture Partners)\n• Doug Neal (Co-Founder & Managing Director at eLab Ventures)\n• Belvin Liles (Principal at ID Ventures)\n• Evan Kramer (CEO at Traliant)\nModerator:\n• Anthony Walker (Former President, AI Business Group)\n\nExplore how venture capital and startup building are evolving alongside AI.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T15:45:00-04:00',
    endTime: '2026-10-23T16:30:00-04:00',
  },
  {
    id: 'closing',
    summary: 'Closing Remarks & Networking - Michigan AI Business Conference 2026',
    location: 'Robertson Auditorium & Lobby, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Closing reflections, wrap-up remarks, and high-impact networking with speakers, attendees, and sponsors.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T16:30:00-04:00',
    endTime: '2026-10-23T17:00:00-04:00',
  },
];

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const paidOnly = args.includes('--paid-only');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📅 Michigan AI Business Conference 2026');
  console.log('   Google Calendar Invite Batch Sync Tool');
  console.log('═══════════════════════════════════════════════════════════════');
  if (isDryRun) {
    console.log('🔍 [DRY RUN MODE ENABLED] - No calendar events will be created.\n');
  }

  // 1. Validate Environment Variables
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI or DATABASE_URL is not set.');
    console.error('   Ensure you are running on Railway or have MONGODB_URI set in .env.local\n');
    process.exit(1);
  }

  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Error: Google Calendar credentials not configured.');
    console.error('   Required in environment: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
    process.exit(1);
  }

  // 2. Connect to MongoDB and query tickets
  console.log('📦 Connecting to database...');
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db();

  const query = { status: 'confirmed' };
  if (paidOnly) {
    query.tier = { $ne: 'Complimentary' };
  }

  const tickets = await db.collection('ConferenceTickets').find(query).toArray();
  console.log(`✓ Retrieved ${tickets.length} confirmed ticket(s) from database`);

  // Extract and deduplicate valid attendees with email addresses
  const attendeeMap = new Map();
  for (const t of tickets) {
    const email = (t.attendeeEmail || '').trim().toLowerCase();
    if (email && email.includes('@') && email.length > 3) {
      if (!attendeeMap.has(email)) {
        attendeeMap.set(email, {
          email,
          displayName: t.attendeeName ? t.attendeeName.trim() : email,
          tier: t.tier || 'General Admission',
        });
      }
    }
  }

  const attendees = Array.from(attendeeMap.values());
  console.log(`✓ Found ${attendees.length} unique ticket holder(s) with valid email addresses\n`);

  if (attendees.length === 0) {
    console.log('⚠️  No ticket holders with email found. Exiting.');
    await mongoClient.close();
    return;
  }

  console.log('👥 Ticket Holders to Invite:');
  attendees.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.displayName} <${a.email}> (${a.tier})`);
  });
  console.log('');

  if (isDryRun) {
    console.log('✨ [DRY RUN COMPLETE] Found 7 events to create for ' + attendees.length + ' attendees.');
    await mongoClient.close();
    return;
  }

  // 3. Initialize Google Calendar API client
  console.log('🔑 Initializing Google Calendar API client...');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  console.log('✅ Google Calendar client authenticated!\n');

  // 4. Create each of the 7 events on the primary calendar
  console.log(`🚀 Creating 7 calendar events with ${attendees.length} attendee invites each...\n`);

  const attendeeList = attendees.map((a) => ({
    email: a.email,
    displayName: a.displayName,
  }));

  const createdEvents = [];

  for (let i = 0; i < CONFERENCE_EVENTS.length; i++) {
    const ev = CONFERENCE_EVENTS[i];
    const num = `[${i + 1}/${CONFERENCE_EVENTS.length}]`;

    console.log(`⏳ ${num} Creating: "${ev.summary}" (${ev.startTime.slice(11, 16)} EDT)...`);

    const eventPayload = {
      summary: ev.summary,
      location: ev.location,
      description: ev.description,
      start: {
        dateTime: ev.startTime,
        timeZone: 'America/Detroit',
      },
      end: {
        dateTime: ev.endTime,
        timeZone: 'America/Detroit',
      },
      attendees: attendeeList,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 15 },       // 15 mins before
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventPayload,
        sendUpdates: 'all', // Sends calendar email invites to all attendees
        conferenceDataVersion: 0,
      });

      console.log(`   ✅ Created successfully! Event ID: ${response.data.id}`);
      if (response.data.htmlLink) {
        console.log(`   🔗 Calendar Link: ${response.data.htmlLink}`);
      }

      createdEvents.push({
        title: ev.summary,
        id: response.data.id,
        link: response.data.htmlLink,
      });

      // Brief 500ms pause between calls to respect Google API quotas
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`   ❌ Failed to create event: ${err.message}`);
      if (err.message && (err.message.includes('insufficient') || err.message.includes('scope') || err.code === 403)) {
        console.error('      ⚠️ Permission Warning: Your Google OAuth refresh token may lack Calendar write scope.');
        console.error('      Ensure your refresh token includes "https://www.googleapis.com/auth/calendar.events".');
      }
    }
  }

  await mongoClient.close();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`🎉 SUCCESS: ${createdEvents.length} of ${CONFERENCE_EVENTS.length} conference calendar events created!`);
  console.log(`   Google Calendar invites were sent to ${attendees.length} ticket holder(s).`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal script error:', err);
  process.exit(1);
});
