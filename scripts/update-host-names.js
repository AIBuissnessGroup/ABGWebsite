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
    
    // Update Ashna Ganesan
    const result1 = await db.collection('recruitment_slots').updateMany(
      { hostName: 'Ashna Ganesan' },
      { $set: { hostName: 'Ashna Ganesan (Analyst)' } }
    );
    console.log('Ashna Ganesan updated:', result1.modifiedCount, 'slots');
    
    // Update Lia to Lia Toltzman (VP of Education)
    const result2 = await db.collection('recruitment_slots').updateMany(
      { hostName: { $regex: /^Lia/i } },
      { $set: { hostName: 'Lia Toltzman (VP of Education)' } }
    );
    console.log('Lia updated:', result2.modifiedCount, 'slots');
    
  } finally {
    await client.close();
  }
}
main();
