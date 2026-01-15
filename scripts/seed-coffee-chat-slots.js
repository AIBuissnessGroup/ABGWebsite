#!/usr/bin/env node
/**
 * Seed coffee chat slots for the active recruitment cycle
 * Usage: node scripts/seed-coffee-chat-slots.js
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient, ObjectId } = require('mongodb');

// Coffee chat host data
const hosts = [
  {
    name: 'Evan Dion',
    location: 'M36',
    slots: ['3:30–4:00', '4:00–4:30', '4:30–5:00', '5:00–5:30']
  },
  {
    name: 'William Huddleston',
    location: 'Bottom floor of the Ugly',
    slots: ['12:00–12:30', '12:30–1:00', '1:00–1:30', '1:30–2:00']
  },
  {
    name: 'Zack Slater',
    location: 'Ross Wintergarden',
    slots: ['2:00–2:30', '2:30–3:00', '3:00–3:30', '3:30–4:00', '4:00–4:30', '4:30–5:00', '5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Zack Krochmal',
    location: 'M36',
    slots: ['2:30–3:00', '3:00–3:30', '3:30–4:00', '4:00–4:30', '4:30–5:00', '5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Ava Moon',
    location: 'Bun Chai',
    slots: ['11:00–11:30', '11:30–12:00', '12:00–12:30', '12:30–1:00', '1:00–1:30', '1:30–2:00', '2:00–2:30', '2:30–3:00']
  },
  {
    name: 'Julia Lotz',
    location: 'Panera',
    slots: ['1:00–1:30', '1:30–2:00', '2:00–2:30', '2:30–3:00', '3:00–3:30', '3:30–4:00', '4:00–4:30', '4:30–5:00', '5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Krishna Kemisetti',
    location: 'Starbucks',
    slots: ['2:30–3:00', '3:00–3:30', '3:30–4:00', '4:00–4:30', '4:30–5:00', '5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Molly Bluestein',
    location: 'Union Sweetwaters',
    slots: ['12:00–12:30', '12:30–1:00', '1:00–1:30', '1:30–2:00', '5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Cormac Moloney',
    location: 'Union Sweetwaters',
    slots: ['12:00–12:30', '12:30–1:00', '4:00–4:30', '4:30–5:00', '5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Nicholas Rivera',
    location: 'M36',
    slots: ['5:00–5:30', '5:30–6:00']
  },
  {
    name: 'Haven Gier',
    location: 'Panera',
    slots: ['12:00–12:30', '12:30–1:00', '1:00–1:30', '1:30–2:00', '2:00–2:30', '2:30–3:00']
  },
  {
    name: 'Evelyn Chao',
    location: 'Verve Misfit Coffee',
    // Tuesday only
    slots: ['5:30–6:00'],
    dayOfWeek: 'Tuesday'
  }
];

// Parse time like "3:30" to hours/minutes
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

// Parse slot string like "3:30–4:00" to start/end times
function parseSlotTime(slotStr) {
  // Handle different dash characters
  const parts = slotStr.split(/[–-]/);
  const startStr = parts[0].trim();
  const endStr = parts[1].trim();
  
  let start = parseTime(startStr);
  let end = parseTime(endStr);
  
  // Convert to 24-hour format (assume PM for times before 7)
  if (start.hours < 7) start.hours += 12;
  if (end.hours < 7) end.hours += 12;
  
  return { start, end };
}

// Create a date for a given day and time in Eastern timezone
function createDateTime(baseDate, hours, minutes) {
  const date = new Date(baseDate);
  // Set time in UTC (Eastern is UTC-5 in winter)
  // We'll store as ISO string and the app handles timezone conversion
  date.setUTCHours(hours + 5, minutes, 0, 0); // +5 for EST offset
  return date.toISOString();
}

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const db = client.db();
    
    // Get active cycle
    const cycle = await db.collection('recruitment_cycles').findOne({ isActive: true });
    if (!cycle) {
      console.error('No active recruitment cycle found!');
      const cycles = await db.collection('recruitment_cycles').find({}).toArray();
      console.log('Available cycles:');
      cycles.forEach(c => console.log(`  - ${c.name} (${c._id}) - active: ${c.isActive}`));
      process.exit(1);
    }
    
    console.log(`Found active cycle: ${cycle.name} (${cycle._id})`);
    
    const cycleId = cycle._id.toString();
    
    // Delete existing coffee chat slots for this cycle (optional - comment out to keep existing)
    const deleteResult = await db.collection('recruitment_slots').deleteMany({ 
      cycleId, 
      kind: 'coffee_chat' 
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing coffee chat slots`);
    
    // Generate slots for each host
    // We'll create slots for the next 7 days (weekdays only)
    const today = new Date();
    const slots = [];
    
    for (const host of hosts) {
      console.log(`\nGenerating slots for ${host.name}...`);
      
      // Generate for next 5 weekdays
      for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        
        const dayOfWeek = date.getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // For Evelyn Chao, only Tuesday
        if (host.dayOfWeek && host.dayOfWeek !== dayName) continue;
        
        // Generate each time slot
        for (const slotStr of host.slots) {
          const { start, end } = parseSlotTime(slotStr);
          
          const startTime = createDateTime(date, start.hours, start.minutes);
          const endTime = createDateTime(date, end.hours, end.minutes);
          
          slots.push({
            cycleId,
            kind: 'coffee_chat',
            hostName: host.name,
            hostEmail: '', // Will be filled if we have emails
            startTime,
            endTime,
            durationMinutes: 30,
            location: host.location,
            maxBookings: 1,
            bookedCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      
      console.log(`  Created ${host.slots.length} slots per day for ${host.name}`);
    }
    
    // Insert all slots
    if (slots.length > 0) {
      const result = await db.collection('recruitment_slots').insertMany(slots);
      console.log(`\n✅ Successfully inserted ${result.insertedCount} coffee chat slots`);
    } else {
      console.log('\n⚠️ No slots generated');
    }
    
    // Show summary
    const summary = await db.collection('recruitment_slots').aggregate([
      { $match: { cycleId, kind: 'coffee_chat' } },
      { $group: { _id: '$hostName', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\nSlots by host:');
    summary.forEach(s => console.log(`  ${s._id}: ${s.count} slots`));
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
