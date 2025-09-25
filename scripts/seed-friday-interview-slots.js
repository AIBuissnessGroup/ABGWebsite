require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// MongoDB connection
const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}
const client = new MongoClient(uri);

// Get next Friday's date
function getNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // Calculate days until next Friday
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday)); // If today is Friday, get next Friday
  return nextFriday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

// Convert 12-hour time to 24-hour time
function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Interview slots data based on your schedule
const interviewSlots = [
  // R1228 slots
  { startTime: '9:00 AM', endTime: '9:45 AM', room: 'R1228' },
  { startTime: '9:45 AM', endTime: '10:30 AM', room: 'R1228' },
  { startTime: '10:30 AM', endTime: '11:15 AM', room: 'R1228' },
  { startTime: '11:15 AM', endTime: '12:00 PM', room: 'R1228' },
  { startTime: '12:00 PM', endTime: '12:45 PM', room: 'R1228' },
  
  // R1238 slots
  { startTime: '9:00 AM', endTime: '9:45 AM', room: 'R1238' },
  { startTime: '9:45 AM', endTime: '10:30 AM', room: 'R1238' },
  { startTime: '10:30 AM', endTime: '11:15 AM', room: 'R1238' },
  { startTime: '11:15 AM', endTime: '12:00 PM', room: 'R1238' },
  { startTime: '12:00 PM', endTime: '12:45 PM', room: 'R1238' },
  
  // R0228 slots
  { startTime: '9:00 AM', endTime: '9:45 AM', room: 'R0228' },
  { startTime: '9:45 AM', endTime: '10:30 AM', room: 'R0228' }
];

async function seedFridayInterviewSlots() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('InterviewSlot');

    const fridayDate = getNextFriday();
    console.log(`Creating interview slots for Friday: ${fridayDate}`);

    // Check if slots already exist for this Friday
    const existingSlots = await collection.find({ date: fridayDate }).toArray();
    if (existingSlots.length > 0) {
      console.log(`Warning: ${existingSlots.length} slots already exist for ${fridayDate}`);
      console.log('Do you want to continue and create additional slots? (This script will continue...)');
    }

    const slotsToCreate = [];

    for (const slot of interviewSlots) {
      const startTime24 = convertTo24Hour(slot.startTime);
      const endTime24 = convertTo24Hour(slot.endTime);

      const slotData = {
        room: slot.room,
        startTime: startTime24,
        endTime: endTime24,
        date: fridayDate,
        status: 'available',
        title: 'Engineering Based Interview',
        description: 'Engineering Based Interview Slot',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      slotsToCreate.push(slotData);
    }

    // Insert all slots
    const result = await collection.insertMany(slotsToCreate);
    console.log(`Successfully created ${result.insertedCount} interview slots for Friday`);
    
    // Display summary
    console.log('\n=== SLOTS CREATED ===');
    console.log(`Date: ${fridayDate}`);
    console.log(`Title: Engineering Based Interview`);
    console.log('\nSlots by room:');
    
    const roomGroups = slotsToCreate.reduce((acc, slot) => {
      if (!acc[slot.room]) acc[slot.room] = [];
      acc[slot.room].push(slot);
      return acc;
    }, {});

    for (const [room, slots] of Object.entries(roomGroups)) {
      console.log(`\n${room}:`);
      slots.forEach(slot => {
        const start12 = convertTo12Hour(slot.startTime);
        const end12 = convertTo12Hour(slot.endTime);
        console.log(`  ${start12} - ${end12}`);
      });
    }

  } catch (error) {
    console.error('Error seeding interview slots:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Helper function to convert 24-hour to 12-hour format for display
function convertTo12Hour(time24) {
  const [hours, minutes] = time24.split(':');
  const hour12 = ((parseInt(hours) + 11) % 12 + 1);
  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
}

// Run the script
if (require.main === module) {
  seedFridayInterviewSlots()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedFridayInterviewSlots };