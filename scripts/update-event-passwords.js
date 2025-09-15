const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

// Helper function to hash password with salt
const hashPassword = (password, salt) => {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
};

async function updateEventPasswords() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('abg-website');
    const eventsCollection = db.collection('Event');
    
    // Event password updates
    const eventUpdates = [
      { title: 'Mass Meeting', password: 'fall25' },
      { title: 'Meet The Members', password: 'letsnetwork!' },
      { title: 'Case/Technical Workshop', password: 'develop25!' }
    ];
    
    for (const update of eventUpdates) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(update.password, salt);
      
      const result = await eventsCollection.updateOne(
        { title: { $regex: new RegExp(update.title, 'i') } },
        { 
          $set: { 
            attendancePasswordHash: hash,
            attendancePasswordSalt: salt,
            attendanceConfirmEnabled: 1,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`Updated ${update.title}:`, result.modifiedCount > 0 ? 'SUCCESS' : 'NOT FOUND');
    }
    
    // Check current events
    const events = await eventsCollection.find({}).toArray();
    console.log('\nCurrent events:');
    events.forEach(event => {
      console.log(`- ${event.title}: attendanceConfirmEnabled=${event.attendanceConfirmEnabled}, hasPassword=${!!event.attendancePasswordHash}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateEventPasswords();
