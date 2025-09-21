const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

async function seedInterviewSlots() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get next Wednesday
    const getNextWednesday = () => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 3 = Wednesday
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
      const nextWednesday = new Date(today);
      nextWednesday.setDate(today.getDate() + daysUntilWednesday);
      return nextWednesday.toISOString().split('T')[0];
    };

    const date = getNextWednesday();
    const rooms = ['R2248', 'R1226', 'R1228', 'R1236', 'R1238', 'R1216'];
    const times = [
      ['18:00', '18:30'],
      ['18:30', '19:00'],
      ['19:00', '19:30'],
      ['19:30', '20:00'],
      ['20:00', '20:30'],
      ['20:30', '21:00'],
      ['21:00', '21:30'],
      ['21:30', '22:00']
    ];

    console.log(`Creating interview slots for ${date}`);

    // Check if slots already exist for this date
    const existingSlots = await db.collection('InterviewSlot').countDocuments({ date });
    if (existingSlots > 0) {
      console.log(`${existingSlots} slots already exist for ${date}. Skipping...`);
      return;
    }

    const slotsToCreate = [];

    // Create slots for each room and time combination
    for (const room of rooms) {
      for (const [startHour, endHour] of times) {
        const startTime = new Date(`${date}T${startHour}:00.000-04:00`); // Eastern Time
        const endTime = new Date(`${date}T${endHour}:00.000-04:00`);

        const slotData = {
          id: `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          room: room,
          startTime: startTime,
          endTime: endTime,
          date: date,
          status: 'available',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'seed-script',
        };

        slotsToCreate.push(slotData);
      }
    }

    // Insert all slots
    const result = await db.collection('InterviewSlot').insertMany(slotsToCreate);
    console.log(`Successfully created ${result.insertedCount} interview slots`);
    
    // Summary
    console.log('\nSlots created:');
    rooms.forEach(room => {
      console.log(`Room ${room}: ${times.length} slots (${times[0][0]} - ${times[times.length-1][1]})`);
    });
    
  } catch (error) {
    console.error('Error seeding interview slots:', error);
  } finally {
    await client.close();
  }
}

// Run the script
if (require.main === module) {
  seedInterviewSlots();
}

module.exports = seedInterviewSlots;