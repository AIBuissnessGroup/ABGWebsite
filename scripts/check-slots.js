require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function checkInterviewSlots() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    
    // Check all collections to see which one contains interview slots
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => console.log(`- ${col.name}`));

    // Check the InterviewSlot collection specifically
    const collection = db.collection('InterviewSlot');
    const totalCount = await collection.countDocuments();
    console.log(`\n✅ Total documents in InterviewSlot collection: ${totalCount}`);
    
    // Show Friday slots specifically
    const fridaySlots = await collection.find({ 
      date: '2025-09-26' 
    }).toArray();
    
    if (fridaySlots.length > 0) {
      console.log(`\n📅 Friday Engineering slots found: ${fridaySlots.length}`);
      console.log('\nFriday slots details:');
      fridaySlots.forEach(slot => {
        console.log(`- ${slot.room} | ${slot.startTime}-${slot.endTime} | ${slot.status} | ${slot.title || 'No title'}`);
      });
    } else {
      console.log('\n❌ No Friday slots found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkInterviewSlots();