const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

const newStudents = [
  'jmlotz@umich.edu',
  'kkniffen@umich.edu',
  'zrslater@umich.edu',
  'kkemiset@umich.edu',
  'hexieli@umich.edu',
  'boussouf@umich.edu',
  'andge@umich.edu',
  'avamoon@umich.edu',
  'juyoungh@umich.edu',
  'carsc@umich.edu',
  'ngrivera@umich.edu',
  'akhosa@umich.edu',
  'joaquinh@umich.edu',
  'yashishm@umich.edu',
  'scgretz@umich.edu',
  'dekollu@umich.edu',
  'ashnag@umich.edu',
  'cormacm@umich.edu',
  'jarstein@umich.edu',
  'mkoury@umich.edu',
  'liatoltz@umich.edu',
  'dsjing@umich.edu',
  'whudd@umich.edu',
  'nathanly@umich.edu',
  'evandion@umich.edu',
  'aizhanat@umich.edu',
  'nefthy@umich.edu',
  'hgier@umich.edu',
  'zackk@umich.edu',
  'mollyblu@umich.edu',
  'nickkoz@umich.edu',
  'maelyna@umich.edu',
  'lxymli@umich.edu'
];

async function addNewStudentsBatch() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log(`🎯 Adding ${newStudents.length} new students to interview whitelist...`);
    console.log(`📅 Batch date: ${new Date().toLocaleDateString()}`);
    
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const email of newStudents) {
      const cleanEmail = email.trim().toLowerCase();
      
      try {
        // Check if email already exists
        const existingEntry = await db.collection('InterviewWhitelist').findOne({ email: cleanEmail });
        
        if (existingEntry) {
          console.log(`⚠️  Skipped ${cleanEmail} - already in whitelist`);
          skippedCount++;
          continue;
        }
        
        // Add to whitelist
        const whitelistEntry = {
          id: `whitelist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: cleanEmail,
          addedBy: 'system-new-batch-sept-2025',
          createdAt: new Date(),
          batchId: 'sept-2025-batch'
        };
        
        await db.collection('InterviewWhitelist').insertOne(whitelistEntry);
        console.log(`✅ Added ${cleanEmail} to interview whitelist`);
        addedCount++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Error adding ${cleanEmail}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Batch Processing Summary:');
    console.log(`✅ Successfully added: ${addedCount} students`);
    console.log(`⚠️  Skipped (already existed): ${skippedCount} students`);
    console.log(`❌ Errors: ${errorCount} students`);
    console.log(`📧 Total processed: ${newStudents.length} emails`);
    
    // Show current whitelist count
    const totalWhitelistCount = await db.collection('InterviewWhitelist').countDocuments();
    console.log(`📋 Total students in interview whitelist: ${totalWhitelistCount}`);
    
    // Show breakdown by batch
    const batchCount = await db.collection('InterviewWhitelist').countDocuments({ batchId: 'sept-2025-batch' });
    console.log(`🎯 Students from this batch: ${batchCount}`);
    
  } catch (error) {
    console.error('❌ Script execution error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
console.log('🚀 Starting interview whitelist batch update...');
addNewStudentsBatch().then(() => {
  console.log('✨ Script completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});