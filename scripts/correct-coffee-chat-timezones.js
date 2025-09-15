const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

async function correctCoffeeChatTimezones() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('CoffeeChat');
    
    // Get all coffee chats
    const coffeeChats = await collection.find({}).toArray();
    console.log(`Found ${coffeeChats.length} coffee chats to correct`);
    
    if (coffeeChats.length === 0) {
      console.log('No coffee chats found to correct');
      return;
    }
    
    const bulkOps = [];
    
    for (const chat of coffeeChats) {
      // The previous correction subtracted 4 hours, but we need to add 8 hours total
      // (4 hours to undo the previous correction + 4 hours to correct the original UTC issue)
      const startTimeCurrent = new Date(chat.startTime);
      const endTimeCurrent = new Date(chat.endTime);
      
      // Add 8 hours to get the correct EDT time
      const startTimeCorrect = new Date(startTimeCurrent.getTime() + (8 * 60 * 60 * 1000));
      const endTimeCorrect = new Date(endTimeCurrent.getTime() + (8 * 60 * 60 * 1000));
      
      console.log(`Correcting chat ${chat._id}:`);
      console.log(`  Start: ${startTimeCurrent.toISOString()} -> ${startTimeCorrect.toISOString()}`);
      console.log(`  End: ${endTimeCurrent.toISOString()} -> ${endTimeCorrect.toISOString()}`);
      
      bulkOps.push({
        updateOne: {
          filter: { _id: chat._id },
          update: {
            $set: {
              startTime: startTimeCorrect,
              endTime: endTimeCorrect,
              updatedAt: new Date()
            }
          }
        }
      });
    }
    
    // Execute bulk update
    if (bulkOps.length > 0) {
      const result = await collection.bulkWrite(bulkOps);
      console.log(`\nCorrection completed:`);
      console.log(`- Modified: ${result.modifiedCount} documents`);
      console.log(`- Matched: ${result.matchedCount} documents`);
      
      // Verify the corrections
      console.log('\nVerifying corrections...');
      const correctedChats = await collection.find({}).sort({ startTime: 1 }).toArray();
      correctedChats.forEach(chat => {
        const startTime = new Date(chat.startTime);
        const endTime = new Date(chat.endTime);
        console.log(`${chat.title || 'Coffee Chat'}: ${startTime.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} - ${endTime.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit'
        })}`);
      });
    }
    
  } catch (error) {
    console.error('Error correcting coffee chat timezones:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

if (require.main === module) {
  correctCoffeeChatTimezones().catch(console.error);
}

module.exports = { correctCoffeeChatTimezones };
