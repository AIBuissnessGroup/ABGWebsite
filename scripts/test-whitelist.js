const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

async function addTestEmail() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    const testEntry = {
      id: 'whitelist_test_' + Date.now(),
      email: 'test@umich.edu',
      addedBy: 'system-test',
      createdAt: new Date(),
    };
    
    await db.collection('InterviewWhitelist').insertOne(testEntry);
    console.log('Added test email to whitelist:', testEntry.email);
    
    // Show current whitelist
    const whitelist = await db.collection('InterviewWhitelist').find({}).toArray();
    console.log('Current whitelist entries:', whitelist.length);
    whitelist.forEach(entry => console.log(' -', entry.email));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addTestEmail();