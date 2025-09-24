const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

async function testInterviewSlotsDisplay() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Testing interview slots display...\n');
    
    // Get all interview slots (what the API would now return)
    const allSlots = await db.collection('InterviewSlot').find({}).toArray();
    
    console.log(`📋 Total slots in database: ${allSlots.length}`);
    
    if (allSlots.length === 0) {
      console.log('❌ No slots found - this explains why nothing is showing up!');
      return;
    }
    
    // Transform the slots the same way the API does
    const transformedSlots = allSlots.map((slot) => ({
      id: slot.id || slot._id.toString(),
      room: slot.room,
      startTime: slot.startTime instanceof Date ? slot.startTime.toISOString() : slot.startTime,
      endTime: slot.endTime instanceof Date ? slot.endTime.toISOString() : slot.endTime,
      date: slot.date,
      status: slot.status,
      bookedByUserId: slot.bookedByUserId,
      signup: slot.signup ? {
        id: slot.signup.id,
        userEmail: slot.signup.userEmail,
        userName: slot.signup.userName,
        uniqname: slot.signup.uniqname,
        createdAt: slot.signup.createdAt instanceof Date ? slot.signup.createdAt.toISOString() : slot.signup.createdAt,
      } : undefined,
    }));
    
    console.log('✅ API would return the following slots:\n');
    
    // Group by date for better display
    const byDate = {};
    transformedSlots.forEach(slot => {
      if (!byDate[slot.date]) {
        byDate[slot.date] = [];
      }
      byDate[slot.date].push(slot);
    });
    
    Object.entries(byDate).forEach(([date, slots]) => {
      console.log(`📅 Date: ${date} (${slots.length} slots)`);
      
      // Group by room
      const byRoom = {};
      slots.forEach(slot => {
        if (!byRoom[slot.room]) {
          byRoom[slot.room] = [];
        }
        byRoom[slot.room].push(slot);
      });
      
      Object.entries(byRoom).forEach(([room, roomSlots]) => {
        console.log(`  🏠 Room ${room}: ${roomSlots.length} slots`);
        roomSlots.forEach(slot => {
          const startTime = new Date(slot.startTime);
          const endTime = new Date(slot.endTime);
          const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
          const statusIcon = slot.status === 'available' ? '🟢' : '🔴';
          const bookedInfo = slot.signup ? ` (${slot.signup.userEmail})` : '';
          console.log(`    ${statusIcon} ${timeStr} - ${slot.status}${bookedInfo}`);
        });
      });
      console.log('');
    });
    
    // Summary
    const available = transformedSlots.filter(s => s.status === 'available').length;
    const booked = transformedSlots.filter(s => s.status === 'booked').length;
    
    console.log('📊 Summary:');
    console.log(`  🟢 Available slots: ${available}`);
    console.log(`  🔴 Booked slots: ${booked}`);
    console.log(`  📋 Total slots: ${transformedSlots.length}`);
    
    if (available > 0) {
      console.log('\n✅ There are available slots - they should be showing up on the website!');
    } else {
      console.log('\n⚠️  All slots are booked - no available slots to display');
    }
    
  } catch (error) {
    console.error('❌ Error testing interview slots:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testInterviewSlotsDisplay().then(() => {
  console.log('\n🎉 Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});