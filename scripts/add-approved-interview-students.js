const { MongoClient } = require('mongodb');

// Use the development credentials from MONGODB_CREDENTIALS.md
const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

const approvedStudents = [
  'evandion@umich.edu',
  'zackk@umich.edu',
  'nefthy@umich.edu',
  'cormacm@umich.edu',
  'jmlotz@umich.edu',
  'kkniffen@umich.edu',
  'zrslater@umich.edu',
  'kkemiset@umich.edu',
  'hexieli@umich.edu',
  'boussouf@umich.edu',
  'andge@umich.edu',
  'avamoon@umich.edu',
  'dbenz@umich.edu',
  'lxymli@umich.edu',
  'juyoungh@umich.edu',
  'carsc@umich.edu',
  'ngrivera@umich.edu',
  'srinitya@umich.edu',
  'richliou@umich.edu',
  'patwang@umich.edu',
  'akhosa@umich.edu',
  'joaquinh@umich.edu',
  'wyattcar@umich.edu',
  'yashishm@umich.edu',
  'alabella@umich.edu',
  'scgretz@umich.edu',
  'dekollu@umich.edu',
  'nriven@umich.edu',
  'tvishas@umich.edu',
  'aizhanat@umich.edu',
  'jarstein@umich.edu',
  'jmande@umich.edu',
  'nickkoz@umich.edu',
  'maelyna@umich.edu',
  'faguiler@umich.edu',
  'liatoltz@umich.edu',
  'zehao@umich.edu',
  'michlim@umich.edu',
  'bermu@umich.edu',
  'mollyblu@umich.edu',
  'whudd@umich.edu',
  'ashnag@umich.edu',
  'hgier@umich.edu',
  'nathanly@umich.edu',
  'hamzar@umich.edu',
  'maansis@umich.edu',
  'mkoury@umich.edu',
  'dsjing@umich.edu'
];

async function addApprovedStudents() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log(`Adding ${approvedStudents.length} approved students to interview whitelist...`);
    
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const email of approvedStudents) {
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
          addedBy: 'system-bulk-add',
          createdAt: new Date(),
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
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${addedCount} students`);
    console.log(`⚠️  Skipped (already existed): ${skippedCount} students`);
    console.log(`❌ Errors: ${errorCount} students`);
    console.log(`📧 Total processed: ${approvedStudents.length} emails`);
    
    // Show current whitelist count
    const totalWhitelistCount = await db.collection('InterviewWhitelist').countDocuments();
    console.log(`📋 Total students in interview whitelist: ${totalWhitelistCount}`);
    
  } catch (error) {
    console.error('❌ Script execution error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
addApprovedStudents().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});