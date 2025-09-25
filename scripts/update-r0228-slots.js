require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}
const client = new MongoClient(uri);

async function updateR0228Slots() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('InterviewSlot');

    // Find all R0228 slots first
    const r0228Slots = await collection.find({ 
      room: 'R0228',
      date: '2025-09-26'
    }).toArray();

    console.log(`\n📍 Found ${r0228Slots.length} R0228 slots to update:`);
    r0228Slots.forEach(slot => {
      console.log(`- ${slot.room} | ${slot.startTime}-${slot.endTime} | Current title: "${slot.title || 'No title'}"`);
    });

    if (r0228Slots.length === 0) {
      console.log('\n❌ No R0228 slots found for Friday 2025-09-26');
      return;
    }

    // Update R0228 slots to have Business title
    const updateResult = await collection.updateMany(
      { 
        room: 'R0228',
        date: '2025-09-26'
      },
      {
        $set: {
          title: 'Business Interview',
          description: 'Business Interview Slot',
          updatedAt: new Date()
        }
      }
    );

    console.log(`\n✅ Successfully updated ${updateResult.modifiedCount} R0228 slots`);

    // Verify the changes
    const updatedSlots = await collection.find({ 
      room: 'R0228',
      date: '2025-09-26'
    }).toArray();

    console.log(`\n📋 Updated R0228 slots:`);
    updatedSlots.forEach(slot => {
      console.log(`- ${slot.room} | ${slot.startTime}-${slot.endTime} | New title: "${slot.title}"`);
    });

    // Show summary of all Friday slots by room
    const allFridaySlots = await collection.find({ 
      date: '2025-09-26'
    }).toArray();

    console.log(`\n📊 Summary of all Friday interview slots by room:`);
    const slotsByRoom = allFridaySlots.reduce((acc, slot) => {
      if (!acc[slot.room]) {
        acc[slot.room] = { count: 0, title: slot.title };
      }
      acc[slot.room].count++;
      return acc;
    }, {});

    for (const [room, info] of Object.entries(slotsByRoom)) {
      console.log(`- ${room}: ${info.count} slots (${info.title})`);
    }

  } catch (error) {
    console.error('Error updating R0228 slots:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

updateR0228Slots()
  .then(() => {
    console.log('✅ Update completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });