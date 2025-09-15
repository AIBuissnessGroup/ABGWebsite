const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

async function fixCoffeeChatTimezones() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('CoffeeChat');
    
    // Get all coffee chats
    const coffeeChats = await collection.find({}).toArray();
    console.log(`Found ${coffeeChats.length} coffee chats to update`);
    
    if (coffeeChats.length === 0) {
      console.log('No coffee chats found to update');
      return;
    }
    
    const bulkOps = [];
    
    for (const chat of coffeeChats) {
      // Convert UTC times to EST/EDT (subtract 4 or 5 hours depending on DST)
      // For simplicity, we'll subtract 4 hours (EDT) since most events are likely during EDT period
      const startTimeUTC = new Date(chat.startTime);
      const endTimeUTC = new Date(chat.endTime);
      
      // Subtract 4 hours to convert from UTC to EDT
      const startTimeEDT = new Date(startTimeUTC.getTime() - (4 * 60 * 60 * 1000));
      const endTimeEDT = new Date(endTimeUTC.getTime() - (4 * 60 * 60 * 1000));
      
      console.log(`Updating chat ${chat._id}:`);
      console.log(`  Start: ${startTimeUTC.toISOString()} (UTC) -> ${startTimeEDT.toISOString()} (EDT)`);
      console.log(`  End: ${endTimeUTC.toISOString()} (UTC) -> ${endTimeEDT.toISOString()} (EDT)`);
      
      bulkOps.push({
        updateOne: {
          filter: { _id: chat._id },
          update: {
            $set: {
              startTime: startTimeEDT,
              endTime: endTimeEDT,
              updatedAt: new Date()
            }
          }
        }
      });
    }
    
    // Execute bulk update
    if (bulkOps.length > 0) {
      const result = await collection.bulkWrite(bulkOps);
      console.log(`\nUpdate completed:`);
      console.log(`- Modified: ${result.modifiedCount} documents`);
      console.log(`- Matched: ${result.matchedCount} documents`);
      
      // Verify the updates
      console.log('\nVerifying updates...');
      const updatedChats = await collection.find({}).sort({ startTime: 1 }).toArray();
      updatedChats.forEach(chat => {
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
    console.error('Error fixing coffee chat timezones:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Check if we're in a specific date range to determine EST vs EDT
function getTimezoneOffset(date) {
  // EDT runs from second Sunday in March to first Sunday in November
  // For this script, we'll assume EDT (UTC-4) since most coffee chats are likely during school year
  return 4; // hours to subtract from UTC
}

if (require.main === module) {
  fixCoffeeChatTimezones().catch(console.error);
}

module.exports = { fixCoffeeChatTimezones };
