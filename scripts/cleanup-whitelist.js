const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

async function cleanupWhitelist() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    // Remove duplicates - keep the first occurrence of each email
    const pipeline = [
      {
        $group: {
          _id: "$email",
          docs: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ];
    
    const duplicates = await db.collection('InterviewWhitelist').aggregate(pipeline).toArray();
    
    for (const group of duplicates) {
      const docsToDelete = group.docs.slice(1); // Keep first, delete rest
      for (const doc of docsToDelete) {
        await db.collection('InterviewWhitelist').deleteOne({ _id: doc._id });
        console.log(`Removed duplicate: ${doc.email}`);
      }
    }
    
    const finalCount = await db.collection('InterviewWhitelist').countDocuments();
    console.log(`Cleanup complete. Final whitelist count: ${finalCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanupWhitelist();