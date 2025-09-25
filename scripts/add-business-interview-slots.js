const { MongoClient } = require('mongodb');

async function addBusinessInterviewSlots() {
  const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('abg-website');
    const collection = db.collection('InterviewSlot');
    
    // Define the date for Friday (September 27, 2024)
    const interviewDate = '2024-09-27';
    
    // Define the new business interview slots
    const newSlots = [
      // R1216 Business slots
      {
        room: 'R1216',
        startTime: '09:00',
        endTime: '09:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1216',
        startTime: '09:45',
        endTime: '10:30',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1216',
        startTime: '10:30',
        endTime: '11:15',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1216',
        startTime: '11:15',
        endTime: '12:00',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1216',
        startTime: '12:00',
        endTime: '12:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      // R0236 Business slots
      {
        room: 'R0236',
        startTime: '09:00',
        endTime: '09:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R0236',
        startTime: '09:45',
        endTime: '10:30',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      // R1226 Business slots
      {
        room: 'R1226',
        startTime: '09:00',
        endTime: '09:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1226',
        startTime: '09:45',
        endTime: '10:30',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1226',
        startTime: '10:30',
        endTime: '11:15',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1226',
        startTime: '11:15',
        endTime: '12:00',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1226',
        startTime: '12:00',
        endTime: '12:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      // R1236 Business slots
      {
        room: 'R1236',
        startTime: '09:00',
        endTime: '09:45',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1236',
        startTime: '09:45',
        endTime: '10:30',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1236',
        startTime: '10:30',
        endTime: '11:15',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1236',
        startTime: '11:15',
        endTime: '12:00',
        date: interviewDate,
        status: 'available',
        title: 'Business Based Interview',
        description: 'Business focused interview session'
      },
      {
        room: 'R1236',
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
    console.log(`Successfully inserted ${result.insertedCount} business interview slots`);
    
    // Print summary by room
    const slotsByRoom = newSlots.reduce((acc, slot) => {
      if (!acc[slot.room]) acc[slot.room] = 0;
      acc[slot.room]++;
      return acc;
    }, {});
    
    console.log('\nSlots added by room:');
    Object.entries(slotsByRoom).forEach(([room, count]) => {
      console.log(`  ${room}: ${count} slots`);
    });
    
  } catch (error) {
    console.error('Error adding business interview slots:', error);
  } finally {
    await client.close();
  }
}

addBusinessInterviewSlots();