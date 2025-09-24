const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

async function checkInterviewSlots() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Checking InterviewSlot collection...\n');
    
    // Get all interview slots
    const allSlots = await db.collection('InterviewSlot').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📋 Total InterviewSlot entries: ${allSlots.length}`);
    
    if (allSlots.length === 0) {
      console.log('❌ No slots found in the collection');
      return;
    }
    
    // Calculate one hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log(`⏰ One hour ago: ${oneHourAgo.toLocaleString()}`);
    console.log(`⏰ Current time: ${new Date().toLocaleString()}`);
    
    // Find slots created in the past hour
    const recentSlots = allSlots.filter(slot => {
      const createdAt = new Date(slot.createdAt);
      return createdAt > oneHourAgo;
    });
    
    console.log(`\n🆕 Slots created in the past hour: ${recentSlots.length}`);
    
    if (recentSlots.length > 0) {
      console.log('\n📝 Recent slots details:');
      recentSlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. ID: ${slot.id || slot._id}`);
        console.log(`     Room: ${slot.room}`);
        console.log(`     Date: ${slot.date}`);
        console.log(`     Time: ${slot.startTime} - ${slot.endTime}`);
        console.log(`     Status: ${slot.status}`);
        console.log(`     Created: ${new Date(slot.createdAt).toLocaleString()}`);
        console.log(`     Booked by: ${slot.signup ? slot.signup.userEmail : 'None'}`);
        console.log('');
      });
    }
    
    // Show older slots for comparison
    const olderSlots = allSlots.filter(slot => {
      const createdAt = new Date(slot.createdAt);
      return createdAt <= oneHourAgo;
    });
    
    console.log(`📅 Older slots (created more than 1 hour ago): ${olderSlots.length}`);
    
    if (olderSlots.length > 0) {
      console.log('\n📝 Sample of older slots:');
      olderSlots.slice(0, 5).forEach((slot, index) => {
        console.log(`  ${index + 1}. Room: ${slot.room}, Date: ${slot.date}, Created: ${new Date(slot.createdAt).toLocaleString()}`);
      });
      if (olderSlots.length > 5) {
        console.log(`  ... and ${olderSlots.length - 5} more older slots`);
      }
    }
    
    // Show date distribution
    const dateGroups = {};
    allSlots.forEach(slot => {
      const dateKey = slot.date || 'No Date';
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = { total: 0, recent: 0 };
      }
      dateGroups[dateKey].total++;
      
      const createdAt = new Date(slot.createdAt);
      if (createdAt > oneHourAgo) {
        dateGroups[dateKey].recent++;
      }
    });
    
    console.log('\n📊 Slots by date:');
    Object.entries(dateGroups).forEach(([date, counts]) => {
      console.log(`  ${date}: ${counts.total} total (${counts.recent} created in past hour)`);
    });
    
  } catch (error) {
    console.error('❌ Error checking interview slots:', error);
  } finally {
    await client.close();
  }
}

// Run the check
checkInterviewSlots().then(() => {
  console.log('\n🎉 Check completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});