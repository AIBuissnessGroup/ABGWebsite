const { MongoClient } = require('mongodb');

async function checkTitles() {
  const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('InterviewSlot');
    const slots = await collection.find({}).toArray();
    console.log('Total slots:', slots.length);
    
    const withoutTitles = slots.filter(slot => !slot.title);
    console.log('Slots without titles:', withoutTitles.length);
    
    if (withoutTitles.length > 0) {
      console.log('\nSlots missing titles:');
      withoutTitles.forEach(slot => {
        console.log(`  ${slot.room}: ${slot.startTime} - ${slot.endTime}`);
      });
    }
    
    console.log('\nSample slots with titles:');
    slots.filter(slot => slot.title).slice(0, 5).forEach(slot => {
      console.log(`  ${slot.room}: ${slot.startTime} - ${slot.endTime} | ${slot.title}`);
    });
    
    console.log('\nAll rooms with slot counts:');
    const roomCounts = {};
    slots.forEach(slot => {
      if (!roomCounts[slot.room]) roomCounts[slot.room] = 0;
      roomCounts[slot.room]++;
    });
    Object.entries(roomCounts).sort().forEach(([room, count]) => {
      console.log(`  ${room}: ${count} slots`);
    });
    
  } finally {
    await client.close();
  }
}

checkTitles();