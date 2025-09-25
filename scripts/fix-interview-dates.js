const { MongoClient } = require('mongodb');

async function fixInterviewDates() {
  const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('abg-website');
    const collection = db.collection('InterviewSlot');
    
    // Find slots with the wrong year (2024 instead of 2025)
    const wrongDateSlots = await collection.find({ date: '2024-09-27' }).toArray();
    console.log(`Found ${wrongDateSlots.length} slots with wrong year (2024-09-27)`);
    
    if (wrongDateSlots.length > 0) {
      // Update all slots from 2024-09-27 to 2025-09-27
      const result = await collection.updateMany(
        { date: '2024-09-27' },
        { $set: { date: '2025-09-27' } }
      );
      
      console.log(`Successfully updated ${result.modifiedCount} slots from 2024-09-27 to 2025-09-27`);
    }
    
    // Check the final state
    const allSlots = await collection.find({}).toArray();
    const dates = [...new Set(allSlots.map(slot => slot.date))];
    console.log('\nFinal dates in database:');
    dates.forEach(date => {
      const count = allSlots.filter(slot => slot.date === date).length;
      console.log(`  ${date}: ${count} slots`);
    });
    
  } catch (error) {
    console.error('Error fixing interview dates:', error);
  } finally {
    await client.close();
  }
}

fixInterviewDates();