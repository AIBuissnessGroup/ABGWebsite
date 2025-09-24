const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

async function analyzeInterviewSlots() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Analyzing InterviewSlot collection...\n');
    
    // Get all interview slots sorted by creation time (newest first)
    const allSlots = await db.collection('InterviewSlot').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📋 Total InterviewSlot entries: ${allSlots.length}`);
    
    if (allSlots.length === 0) {
      console.log('❌ No slots found in the collection');
      return;
    }
    
    // Show the most recent 10 slots
    console.log('\n🆕 Most recent 10 slots:');
    allSlots.slice(0, 10).forEach((slot, index) => {
      console.log(`  ${index + 1}. Room: ${slot.room}, Date: ${slot.date}, Time: ${slot.startTime}`);
      console.log(`      Created: ${new Date(slot.createdAt).toLocaleString()}`);
      console.log(`      Status: ${slot.status}, ID: ${slot.id || slot._id}`);
      console.log('');
    });
    
    // Group by creation time (by hour)
    const timeGroups = {};
    allSlots.forEach(slot => {
      const createdAt = new Date(slot.createdAt);
      const hourKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:00`;
      
      if (!timeGroups[hourKey]) {
        timeGroups[hourKey] = { count: 0, samples: [] };
      }
      timeGroups[hourKey].count++;
      if (timeGroups[hourKey].samples.length < 3) {
        timeGroups[hourKey].samples.push({
          room: slot.room,
          date: slot.date,
          status: slot.status
        });
      }
    });
    
    console.log('📊 Slots created by hour:');
    Object.entries(timeGroups)
      .sort((a, b) => b[0].localeCompare(a[0])) // Sort by time desc
      .slice(0, 10) // Show last 10 hours
      .forEach(([hour, data]) => {
        console.log(`  ${hour}: ${data.count} slots`);
        data.samples.forEach(sample => {
          console.log(`    - ${sample.room} for ${sample.date} (${sample.status})`);
        });
      });
    
    // Check for duplicates by date and room/time
    const duplicates = {};
    allSlots.forEach(slot => {
      const key = `${slot.date}_${slot.room}_${slot.startTime}_${slot.endTime}`;
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(slot);
    });
    
    const duplicateKeys = Object.keys(duplicates).filter(key => duplicates[key].length > 1);
    
    if (duplicateKeys.length > 0) {
      console.log(`\n⚠️  Found ${duplicateKeys.length} duplicate slot configurations:`);
      duplicateKeys.slice(0, 5).forEach(key => {
        const slots = duplicates[key];
        console.log(`  ${key}: ${slots.length} instances`);
        slots.forEach((slot, i) => {
          console.log(`    ${i + 1}. Created: ${new Date(slot.createdAt).toLocaleString()}, ID: ${slot.id || slot._id}`);
        });
      });
    }
    
    // Show date distribution
    const dateGroups = {};
    allSlots.forEach(slot => {
      const dateKey = slot.date || 'No Date';
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = { count: 0, latestCreation: null };
      }
      dateGroups[dateKey].count++;
      
      const createdAt = new Date(slot.createdAt);
      if (!dateGroups[dateKey].latestCreation || createdAt > dateGroups[dateKey].latestCreation) {
        dateGroups[dateKey].latestCreation = createdAt;
      }
    });
    
    console.log('\n📅 Slots by target date:');
    Object.entries(dateGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, data]) => {
        console.log(`  ${date}: ${data.count} slots (latest created: ${data.latestCreation.toLocaleString()})`);
      });
    
  } catch (error) {
    console.error('❌ Error analyzing interview slots:', error);
  } finally {
    await client.close();
  }
}

// Run the analysis
analyzeInterviewSlots().then(() => {
  console.log('\n🎉 Analysis completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
});