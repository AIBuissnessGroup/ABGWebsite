const { MongoClient } = require('mongodb');

async function addR2238BusinessSlots() {
  const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('abg-website');
    const collection = db.collection('InterviewSlot');
    
    // Define the date for Friday (September 27, 2024)
    const interviewDate = '2024-09-27';
    
    // Define the new R2238 business interview slots
    const newSlots = [
      {
        room: 'R2238',
        startTime: '09:00',
        endTime: '09:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R2238',
        startTime: '09:45',
        endTime: '10:30',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R2238',
        startTime: '10:30',
        endTime: '11:15',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R2238',
        startTime: '11:15',
        endTime: '12:00',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R2238',
        startTime: '12:00',
        endTime: '12:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      }
    ];

    // Insert the new slots
    const result = await collection.insertMany(newSlots);
    console.log(`Successfully inserted ${result.insertedCount} R2238 business interview slots`);
    
    console.log('\nNew R2238 slots added:');
    newSlots.forEach(slot => {
      console.log(`  ${slot.startTime} - ${slot.endTime} | ${slot.title}`);
    });
    
  } catch (error) {
    console.error('Error adding R2238 business interview slots:', error);
  } finally {
    await client.close();
  }
}

addR2238BusinessSlots();