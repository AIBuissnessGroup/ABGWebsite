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

async function verifyWhitelist() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Verifying interview whitelist...\n');
    
    // Get all whitelist entries
    const whitelistEntries = await db.collection('InterviewWhitelist').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📋 Total entries in InterviewWhitelist collection: ${whitelistEntries.length}`);
    console.log(`📧 Expected approved students: ${approvedStudents.length}`);
    
    let foundCount = 0;
    let missingStudents = [];
    
    console.log('\n✅ Checking each approved student:');
    for (const email of approvedStudents) {
      const cleanEmail = email.trim().toLowerCase();
      const found = whitelistEntries.find(entry => entry.email === cleanEmail);
      
      if (found) {
        console.log(`  ✅ ${cleanEmail} - Added by: ${found.addedBy} at ${new Date(found.createdAt).toLocaleString()}`);
        foundCount++;
      } else {
        console.log(`  ❌ ${cleanEmail} - NOT FOUND`);
        missingStudents.push(cleanEmail);
      }
    }
    
    console.log('\n📊 Verification Summary:');
    console.log(`✅ Found in whitelist: ${foundCount}/${approvedStudents.length}`);
    
    if (missingStudents.length > 0) {
      console.log(`❌ Missing students: ${missingStudents.length}`);
      console.log('Missing emails:', missingStudents);
    } else {
      console.log('🎉 All approved students are successfully in the whitelist!');
    }
    
    // Show some additional entries that might exist
    const otherEntries = whitelistEntries.filter(entry => 
      !approvedStudents.map(e => e.toLowerCase()).includes(entry.email)
    );
    
    if (otherEntries.length > 0) {
      console.log(`\n📝 Additional entries in whitelist (${otherEntries.length}):`);
      otherEntries.forEach(entry => {
        console.log(`  📧 ${entry.email} - Added by: ${entry.addedBy} at ${new Date(entry.createdAt).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await client.close();
  }
}

// Run the verification
verifyWhitelist().then(() => {
  console.log('\n🎉 Verification completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});