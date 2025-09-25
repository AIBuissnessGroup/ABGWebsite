require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function verifySlotTitles() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('InterviewSlot');

    // Get all Friday slots
    const fridaySlots = await collection.find({ 
      date: '2025-09-26' 
    }).sort({ room: 1, startTime: 1 }).toArray();

    console.log(`\n📅 Friday Interview Slots (${fridaySlots.length} total):\n`);

    let currentRoom = '';
    fridaySlots.forEach(slot => {
      if (slot.room !== currentRoom) {
        currentRoom = slot.room;
        console.log(`\n📍 Room ${slot.room}:`);
      }
      
      const startTime = slot.startTime;
      const endTime = slot.endTime;
      const title = slot.title || 'No title';
      
      console.log(`  ${startTime} - ${endTime} | ${title} | ${slot.status}`);
    });

    console.log(`\n📊 Summary:`);
    const roomSummary = fridaySlots.reduce((acc, slot) => {
      if (!acc[slot.room]) {
        acc[slot.room] = { count: 0, title: slot.title || 'No title' };
      }
      acc[slot.room].count++;
      return acc;
    }, {});

    for (const [room, info] of Object.entries(roomSummary)) {
      console.log(`- ${room}: ${info.count} slots (${info.title})`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifySlotTitles();