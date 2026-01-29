#!/usr/bin/env node
/**
 * Seed behavioral interview (round 2) slots for Winter 2026 recruitment
 * 
 * Run with: node scripts/seed-behavioral-interviews.js
 * 
 * Schedule (January 29, 2026):
 * - Blau 1566: Engineering (Noah Feigenbaum, John Fullerton)
 * - Blau 1574: Engineering (Anthony Walker with Robert Doyle) + Business (Evelyn Chao)
 * - Blau 1576: Business (Jessica Au, Ethan Watson)
 * - Blau 1584: AI Investment Fund (Jacob Walker, Ethan Watson, Vincent Antonio)
 * - Blau 3576: AI Investment Fund (Michael Todaro)
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const path = require('path');

// TLS options for AWS DocumentDB
const tlsOptions = {
  tls: true,
  tlsCAFile: path.join(__dirname, '..', 'global-bundle.pem'),
};

// Email lookup by name
const emailLookup = {
  'Julia Lotz': 'jmlotz@umich.edu',
  'Anthony Walker': 'skywlkr@umich.edu',
  'Noah Feigenbaum': 'noahfeig@umich.edu',
  'Evelyn Chao': 'evchao@umich.edu',
  'Ethan Watson': 'ethanwat@umich.edu',
  'Jessica Au': 'jvpau@umich.edu',
  'Robert Doyle': 'robdoyle@umich.edu',
  'Vincent Antonio': 'antonvin@umich.edu',
  'John Fullerton': 'johnfull@umich.edu',
  'Michael Todaro': 'mtodaro@umich.edu',
  'Jacob Walker': 'jacobdw@umich.edu',
};

// The date for behavioral interviews: Wednesday, January 28, 2026
const INTERVIEW_DATE = '2026-01-28';

// Behavioral interview slots data organized by track
const interviewSlots = [
  // ============================================================================
  // ENGINEERING TRACK - Blau 1566
  // ============================================================================
  { start: '5:30 PM', end: '6:00 PM', room: 'Blau 1566', interviewer: 'Noah Feigenbaum', notetaker: '', track: 'engineering' },
  { start: '6:00 PM', end: '6:30 PM', room: 'Blau 1566', interviewer: 'Noah Feigenbaum', notetaker: '', track: 'engineering' },
  { start: '6:30 PM', end: '7:00 PM', room: 'Blau 1566', interviewer: 'Noah Feigenbaum', notetaker: '', track: 'engineering' },
  { start: '7:30 PM', end: '8:00 PM', room: 'Blau 1566', interviewer: 'Noah Feigenbaum', notetaker: '', track: 'engineering' },
  { start: '8:00 PM', end: '8:30 PM', room: 'Blau 1566', interviewer: 'John Fullerton', notetaker: '', track: 'engineering' },
  { start: '8:30 PM', end: '9:00 PM', room: 'Blau 1566', interviewer: 'John Fullerton', notetaker: '', track: 'engineering' },
  { start: '9:00 PM', end: '9:30 PM', room: 'Blau 1566', interviewer: 'John Fullerton', notetaker: '', track: 'engineering' },

  // ============================================================================
  // ENGINEERING TRACK - Blau 1574 (Anthony Walker with Robert Doyle as notetaker)
  // ============================================================================
  { start: '5:30 PM', end: '6:00 PM', room: 'Blau 1574', interviewer: 'Anthony Walker', notetaker: 'Robert Doyle', track: 'engineering' },
  { start: '6:00 PM', end: '6:30 PM', room: 'Blau 1574', interviewer: 'Anthony Walker', notetaker: 'Robert Doyle', track: 'engineering' },
  { start: '6:30 PM', end: '7:00 PM', room: 'Blau 1574', interviewer: 'Anthony Walker', notetaker: 'Robert Doyle', track: 'engineering' },
  { start: '7:30 PM', end: '8:00 PM', room: 'Blau 1574', interviewer: 'Anthony Walker', notetaker: 'Robert Doyle', track: 'engineering' },

  // ============================================================================
  // BUSINESS TRACK - Blau 1574 (Evelyn Chao)
  // ============================================================================
  { start: '8:00 PM', end: '8:30 PM', room: 'Blau 1574', interviewer: 'Evelyn Chao', notetaker: '', track: 'business' },
  { start: '8:30 PM', end: '9:00 PM', room: 'Blau 1574', interviewer: 'Evelyn Chao', notetaker: '', track: 'business' },
  { start: '9:00 PM', end: '9:30 PM', room: 'Blau 1574', interviewer: 'Evelyn Chao', notetaker: '', track: 'business' },

  // ============================================================================
  // BUSINESS TRACK - Blau 1576
  // ============================================================================
  { start: '5:30 PM', end: '6:00 PM', room: 'Blau 1576', interviewer: 'Jessica Au', notetaker: '', track: 'business' },
  { start: '6:00 PM', end: '6:30 PM', room: 'Blau 1576', interviewer: 'Jessica Au', notetaker: '', track: 'business' },
  { start: '6:30 PM', end: '7:00 PM', room: 'Blau 1576', interviewer: 'Jessica Au', notetaker: '', track: 'business' },
  { start: '7:30 PM', end: '8:00 PM', room: 'Blau 1576', interviewer: 'Ethan Watson', notetaker: '', track: 'business' },
  { start: '8:00 PM', end: '8:30 PM', room: 'Blau 1576', interviewer: 'Ethan Watson', notetaker: '', track: 'business' },
  { start: '8:30 PM', end: '9:00 PM', room: 'Blau 1576', interviewer: 'Ethan Watson', notetaker: '', track: 'business' },
  { start: '9:00 PM', end: '9:30 PM', room: 'Blau 1576', interviewer: 'Ethan Watson', notetaker: '', track: 'business' },

  // ============================================================================
  // AI INVESTMENT FUND TRACK - Blau 1584
  // ============================================================================
  { start: '5:30 PM', end: '6:00 PM', room: 'Blau 1584', interviewer: 'Jacob Walker', notetaker: 'Julia Lotz', track: 'ai_investment_fund' },
  { start: '6:00 PM', end: '6:30 PM', room: 'Blau 1584', interviewer: 'Jacob Walker', notetaker: 'Julia Lotz', track: 'ai_investment_fund' },
  { start: '6:30 PM', end: '7:00 PM', room: 'Blau 1584', interviewer: 'Ethan Watson', notetaker: '', track: 'ai_investment_fund' },
  { start: '7:30 PM', end: '8:00 PM', room: 'Blau 1584', interviewer: 'Vincent Antonio', notetaker: '', track: 'ai_investment_fund' },
  { start: '8:00 PM', end: '8:30 PM', room: 'Blau 1584', interviewer: 'Vincent Antonio', notetaker: 'Anthony Walker', track: 'ai_investment_fund' },
  { start: '8:30 PM', end: '9:00 PM', room: 'Blau 1584', interviewer: 'Jacob Walker', notetaker: 'Julia Lotz', track: 'ai_investment_fund' },
  { start: '9:00 PM', end: '9:30 PM', room: 'Blau 1584', interviewer: 'Jacob Walker', notetaker: 'Julia Lotz', track: 'ai_investment_fund' },

  // ============================================================================
  // AI INVESTMENT FUND TRACK - Blau 3576
  // ============================================================================
  { start: '7:00 PM', end: '7:30 PM', room: 'Blau 3576', interviewer: 'Michael Todaro', notetaker: '', track: 'ai_investment_fund' },
  { start: '7:30 PM', end: '8:00 PM', room: 'Blau 3576', interviewer: 'Michael Todaro', notetaker: '', track: 'ai_investment_fund' },
];

// Parse time like "5:30 PM" to 24-hour format
function parseTime12Hour(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) throw new Error(`Invalid time format: ${timeStr}`);
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

// Create ISO datetime string for a given date and time in Eastern timezone
function createDateTime(dateStr, hours, minutes) {
  // dateStr is like "2026-01-28"
  // Create a proper Eastern time date by using the date string with time
  // Format: "2026-01-28T17:30:00" then append timezone offset
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  // Use a proper timezone-aware approach
  const dateTimeStr = `${dateStr}T${timeStr}`;
  
  // Create date in local time (server is EST/EDT)
  // But safer to calculate UTC explicitly: EST is UTC-5
  const estDate = new Date(`${dateTimeStr}-05:00`); // ISO 8601 with offset
  return estDate.toISOString();
}

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new MongoClient(uri, tlsOptions);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const db = client.db();
    
    // Get active cycle
    const cycle = await db.collection('recruitment_cycles').findOne({ isActive: true });
    if (!cycle) {
      console.error('No active recruitment cycle found!');
      process.exit(1);
    }
    
    console.log(`Found active cycle: ${cycle.name} (${cycle._id})`);
    
    const cycleId = cycle._id.toString();
    
    // Check for existing round 2 interview slots
    const existingCount = await db.collection('recruitment_slots').countDocuments({
      cycleId,
      kind: 'interview_round2'
    });
    
    if (existingCount > 0) {
      console.log(`\n⚠️  Found ${existingCount} existing round 2 interview slots.`);
      console.log('    These will be preserved. To delete them first, run:');
      console.log('    db.recruitment_slots.deleteMany({ cycleId: "' + cycleId + '", kind: "interview_round2" })');
      console.log('');
    }
    
    // Generate slot documents
    const slots = [];
    
    console.log('\nGenerating behavioral interview slots for ' + INTERVIEW_DATE + '...\n');
    
    const trackCounts = {
      engineering: 0,
      business: 0,
      ai_investment_fund: 0
    };
    
    for (const slotData of interviewSlots) {
      const startTime = parseTime12Hour(slotData.start);
      const endTime = parseTime12Hour(slotData.end);
      
      const startIso = createDateTime(INTERVIEW_DATE, startTime.hours, startTime.minutes);
      const endIso = createDateTime(INTERVIEW_DATE, endTime.hours, endTime.minutes);
      
      const hostEmail = emailLookup[slotData.interviewer] || 'recruitment@umich.edu';
      
      // Build location string
      let location = slotData.room;
      if (slotData.notetaker) {
        location += ` (Notetaker: ${slotData.notetaker})`;
      }
      
      slots.push({
        cycleId,
        kind: 'interview_round2',
        hostName: slotData.interviewer,
        hostEmail,
        startTime: startIso,
        endTime: endIso,
        durationMinutes: 30,
        location,
        track: slotData.track,
        maxBookings: 1,
        bookedCount: 0,
        notes: slotData.notetaker ? `Notetaker: ${slotData.notetaker}` : 'Behavioral Interview',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      trackCounts[slotData.track]++;
      
      console.log(`  ${slotData.track.padEnd(18)} | ${slotData.start}-${slotData.end} | ${slotData.room.padEnd(12)} | ${slotData.interviewer}`);
    }
    
    console.log('\n--- Summary ---');
    console.log(`Engineering:        ${trackCounts.engineering} slots`);
    console.log(`Business:           ${trackCounts.business} slots`);
    console.log(`AI Investment Fund: ${trackCounts.ai_investment_fund} slots`);
    console.log(`Total:              ${slots.length} slots`);
    
    // Insert all slots
    if (slots.length > 0) {
      const result = await db.collection('recruitment_slots').insertMany(slots);
      console.log(`\n✅ Successfully inserted ${result.insertedCount} behavioral interview slots`);
    }
    
    // Verify final counts
    const finalCount = await db.collection('recruitment_slots').countDocuments({
      cycleId,
      kind: 'interview_round2'
    });
    
    console.log(`\nTotal round 2 interview slots in database: ${finalCount}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

main();
