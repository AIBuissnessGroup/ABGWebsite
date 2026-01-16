#!/usr/bin/env node
/**
 * Add coffee chat slots for Ashna Ganesan
 * Tuesday, January 20th, 5-9 PM (30 min slots)
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const path = require('path');

// TLS options for AWS DocumentDB
const tlsOptions = {
  tls: true,
  tlsCAFile: path.join(__dirname, '..', 'global-bundle.pem'),
};

// Ashna's coffee chat data
const host = {
  name: 'Ashna Ganesan',
  email: 'ashnag@umich.edu',
  location: 'Union Sweetwaters',
  // 5-9 PM = 5:00, 5:30, 6:00, 6:30, 7:00, 7:30, 8:00, 8:30 (8 slots)
  slots: ['5:00–5:30', '5:30–6:00', '6:00–6:30', '6:30–7:00', '7:00–7:30', '7:30–8:00', '8:00–8:30', '8:30–9:00']
};

// The specific date: Tuesday, January 20, 2026
const slotDate = new Date('2026-01-20');

// Parse time like "3:30" to hours/minutes
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

// Parse slot string like "3:30–4:00" to start/end times
function parseSlotTime(slotStr) {
  const parts = slotStr.split(/[–-]/);
  const startStr = parts[0].trim();
  const endStr = parts[1].trim();
  
  let start = parseTime(startStr);
  let end = parseTime(endStr);
  
  // Convert to 24-hour format - these are PM times (5-9 PM = 17-21)
  if (start.hours < 12) start.hours += 12;
  if (end.hours < 12) end.hours += 12;
  
  return { start, end };
}

// Create a date for a given day and time in Eastern timezone
function createDateTime(baseDate, hours, minutes) {
  const date = new Date(baseDate);
  // Set time in UTC (Eastern is UTC-5 in winter/EST)
  date.setUTCHours(hours + 5, minutes, 0, 0); // +5 for EST offset
  return date.toISOString();
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
    
    // Check if Ashna already has slots for this date
    const existingSlots = await db.collection('recruitment_slots').find({
      cycleId,
      kind: 'coffee_chat',
      hostName: host.name,
      startTime: {
        $gte: createDateTime(slotDate, 0, 0),
        $lt: createDateTime(new Date(slotDate.getTime() + 24*60*60*1000), 0, 0)
      }
    }).toArray();
    
    if (existingSlots.length > 0) {
      console.log(`⚠️ ${host.name} already has ${existingSlots.length} slots for Jan 20, 2026`);
      console.log('Existing slots:', existingSlots.map(s => s.startTime));
      console.log('Do you want to delete them first? Proceeding anyway...');
    }
    
    // Generate slots
    const slots = [];
    
    console.log(`\nGenerating slots for ${host.name} on Jan 20, 2026...`);
    
    for (const slotStr of host.slots) {
      const { start, end } = parseSlotTime(slotStr);
      
      const startTime = createDateTime(slotDate, start.hours, start.minutes);
      const endTime = createDateTime(slotDate, end.hours, end.minutes);
      
      slots.push({
        cycleId,
        kind: 'coffee_chat',
        hostName: host.name,
        hostEmail: host.email,
        startTime,
        endTime,
        durationMinutes: 30,
        location: host.location,
        maxBookings: 1,
        bookedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`  Slot: ${slotStr} -> ${startTime}`);
    }
    
    // Insert all slots
    if (slots.length > 0) {
      const result = await db.collection('recruitment_slots').insertMany(slots);
      console.log(`\n✅ Successfully inserted ${result.insertedCount} coffee chat slots for ${host.name}`);
    }
    
    // Show summary for this host
    const total = await db.collection('recruitment_slots').countDocuments({
      cycleId,
      kind: 'coffee_chat',
      hostName: host.name
    });
    
    console.log(`\n${host.name} now has ${total} total coffee chat slots`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
