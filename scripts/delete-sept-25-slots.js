const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

async function deleteSlotsForSept25() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Checking slots for September 25th, 2025...\n');
    
    // First, let's see what we're about to delete
    const slotsToDelete = await db.collection('InterviewSlot').find({ date: '2025-09-25' }).toArray();
    
    console.log(`📋 Found ${slotsToDelete.length} slots for 2025-09-25`);
    
    if (slotsToDelete.length === 0) {
      console.log('✅ No slots found for 2025-09-25 to delete');
      return;
    }
    
    // Show a sample of what we're deleting
    console.log('\n📝 Sample of slots to be deleted:');
    slotsToDelete.slice(0, 5).forEach((slot, index) => {
      console.log(`  ${index + 1}. Room: ${slot.room}`);
      console.log(`     Time: ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}`);
      console.log(`     Status: ${slot.status}`);
      console.log(`     Created: ${new Date(slot.createdAt).toLocaleString()}`);
      console.log(`     ID: ${slot.id || slot._id}`);
      if (slot.signup) {
        console.log(`     ⚠️  BOOKED BY: ${slot.signup.userEmail}`);
      }
      console.log('');
    });
    
    if (slotsToDelete.length > 5) {
      console.log(`  ... and ${slotsToDelete.length - 5} more slots`);
    }
    
    // Check if any are booked
    const bookedSlots = slotsToDelete.filter(slot => slot.status === 'booked' && slot.signup);
    
    if (bookedSlots.length > 0) {
      console.log(`\n⚠️  WARNING: ${bookedSlots.length} slots are BOOKED by students:`);
      bookedSlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. Room ${slot.room} at ${new Date(slot.startTime).toLocaleTimeString()} - BOOKED BY: ${slot.signup.userEmail}`);
      });
      console.log('\n❗ These students will lose their interview slots if we proceed!');
    }
    
    // Show what will remain
    const remainingSlots = await db.collection('InterviewSlot').find({ date: { $ne: '2025-09-25' } }).toArray();
    console.log(`\n📊 After deletion, ${remainingSlots.length} slots will remain for other dates`);
    
    // Group remaining by date
    const dateGroups = {};
    remainingSlots.forEach(slot => {
      const dateKey = slot.date || 'No Date';
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = 0;
      }
      dateGroups[dateKey]++;
    });
    
    console.log('📅 Remaining slots by date:');
    Object.entries(dateGroups).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} slots`);
    });
    
    console.log('\n⚠️  READY TO DELETE - This will permanently remove all September 25th slots!');
    console.log('🔥 Proceeding with deletion in 3 seconds...');
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Perform the deletion
    console.log('\n🗑️  Deleting slots for 2025-09-25...');
    
    const deleteResult = await db.collection('InterviewSlot').deleteMany({ date: '2025-09-25' });
    
    console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} slots for September 25th, 2025`);
    
    // Verify the deletion
    const remainingTotal = await db.collection('InterviewSlot').countDocuments();
    console.log(`📋 Total slots remaining in collection: ${remainingTotal}`);
    
    // Double-check no Sept 25th slots remain
    const sept25Check = await db.collection('InterviewSlot').countDocuments({ date: '2025-09-25' });
    if (sept25Check === 0) {
      console.log('✅ Confirmed: No September 25th slots remain in the database');
    } else {
      console.log(`❌ Warning: ${sept25Check} September 25th slots still exist!`);
    }
    
  } catch (error) {
    console.error('❌ Error deleting slots:', error);
  } finally {
    await client.close();
  }
}

// Run the deletion
deleteSlotsForSept25().then(() => {
  console.log('\n🎉 Deletion completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Deletion failed:', error);
  process.exit(1);
});