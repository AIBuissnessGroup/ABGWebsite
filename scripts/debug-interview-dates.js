const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

function getNextWednesday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 3 = Wednesday
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
  const nextWednesday = new Date(today);
  nextWednesday.setDate(today.getDate() + daysUntilWednesday);
  return nextWednesday.toISOString().split('T')[0];
}

async function debugInterviewDates() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Debugging interview date mismatch...\n');
    
    // Check what date the frontend is looking for
    const today = new Date();
    const nextWednesday = getNextWednesday();
    
    console.log('📅 Date calculations:');
    console.log(`  Today: ${today.toDateString()} (${today.toISOString().split('T')[0]})`);
    console.log(`  Today is day: ${today.getDay()} (0=Sunday, 1=Monday, ..., 3=Wednesday)`);
    console.log(`  Next Wednesday calculated: ${nextWednesday}`);
    
    // Check what dates are actually in the database
    const allSlots = await db.collection('InterviewSlot').find({}).toArray();
    const uniqueDates = [...new Set(allSlots.map(slot => slot.date))].sort();
    
    console.log(`\n📋 Database status:`);
    console.log(`  Total slots: ${allSlots.length}`);
    console.log(`  Unique dates in DB: ${uniqueDates.join(', ')}`);
    
    // Check what the API would return for different dates
    console.log(`\n🔍 API query simulations:`);
    
    for (const date of uniqueDates) {
      const slotsForDate = allSlots.filter(slot => slot.date === date);
      console.log(`  Slots for ${date}: ${slotsForDate.length}`);
    }
    
    // Test the exact query the frontend would make
    console.log(`\n🎯 Frontend would query for: ${nextWednesday}`);
    const frontendSlots = allSlots.filter(slot => slot.date === nextWednesday);
    console.log(`  Results: ${frontendSlots.length} slots`);
    
    if (frontendSlots.length === 0) {
      console.log(`\n❌ MISMATCH FOUND!`);
      console.log(`  Frontend looking for: ${nextWednesday}`);
      console.log(`  Database has dates: ${uniqueDates.join(', ')}`);
      
      if (uniqueDates.includes('2025-09-24')) {
        console.log(`\n💡 Suggested fix:`);
        if (nextWednesday !== '2025-09-24') {
          console.log(`  The slots are for today (2025-09-24) but frontend expects: ${nextWednesday}`);
          console.log(`  Either:`);
          console.log(`    1. Update slot dates to ${nextWednesday}`);
          console.log(`    2. Or modify frontend logic to use correct date`);
        }
      }
    } else {
      console.log(`\n✅ Dates match! Should be working.`);
    }
    
    // Show sample slot data
    if (allSlots.length > 0) {
      console.log(`\n📝 Sample slot from database:`);
      const sample = allSlots[0];
      console.log(`  Date: ${sample.date}`);
      console.log(`  Room: ${sample.room}`);
      console.log(`  Start: ${sample.startTime}`);
      console.log(`  End: ${sample.endTime}`);
      console.log(`  Status: ${sample.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging dates:', error);
  } finally {
    await client.close();
  }
}

// Run the debug
debugInterviewDates().then(() => {
  console.log('\n🎉 Debug completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});