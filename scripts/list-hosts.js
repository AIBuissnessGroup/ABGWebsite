require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const path = require('path');

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL, {
    tls: true,
    tlsCAFile: path.join(__dirname, '..', 'global-bundle.pem'),
  });
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get all unique host names
    const hosts = await db.collection('recruitment_slots').distinct('hostName', { kind: 'coffee_chat' });
    console.log('Current coffee chat hosts:');
    hosts.forEach(h => console.log(' -', h));
    
  } finally {
    await client.close();
  }
}
main();
