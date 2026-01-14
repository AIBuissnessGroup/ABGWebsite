/**
 * Backfill userEmail and userName for existing applications
 * by looking up users in the 'users' collection.
 * 
 * Run with: node scripts/backfill-user-emails.js
 */

require('dotenv').config({ path: '.env.production' });
const { MongoClient, ObjectId } = require('mongodb');

// Check if connection string has TLS in it
const connectionString = process.env.DATABASE_URL || '';
const hasTlsInConnectionString = /[?&](tls|ssl)=/.test(connectionString);

const mongoOptions = hasTlsInConnectionString
  ? { tlsAllowInvalidCertificates: true }
  : { tls: true, tlsCAFile: './global-bundle.pem' };

async function backfillEmails() {
  const client = new MongoClient(process.env.DATABASE_URL, mongoOptions);

  try {
    await client.connect();
    console.log('Connected to database');
    const db = client.db();
    
    // First, let's understand the users collection structure
    const sampleUsers = await db.collection('users').find({}).limit(3).toArray();
    console.log('Sample users:', JSON.stringify(sampleUsers, null, 2));
    
    // Get all applications
    const applications = await db.collection('recruitment_applications').find({}).toArray();
    console.log(`Found ${applications.length} total applications`);
    
    // Show sample application userId
    if (applications.length > 0) {
      console.log('Sample app userId:', applications[0].userId);
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const app of applications) {
      let email = null;
      let name = null;
      
      // Strategy 1: Check if userId is an email
      if (app.userId?.includes('@')) {
        email = app.userId;
        name = app.userId.split('@')[0];
      }
      
      // Strategy 2: Look up user in users collection by various methods
      if (!email) {
        // Try matching by string comparison of _id
        let userDoc = await db.collection('users').findOne({ 
          $or: [
            { email: app.userId },
            { _id: app.userId }
          ]
        });
        
        // Try matching by ObjectId if userId looks like ObjectId
        if (!userDoc && app.userId?.length === 24) {
          try {
            userDoc = await db.collection('users').findOne({ _id: new ObjectId(app.userId) });
          } catch (e) {}
        }
        
        if (userDoc) {
          email = userDoc.email;
          name = userDoc.name;
          console.log(`Found user for app ${app._id}: ${email}`);
        }
      }
      
      // Strategy 3: Check accounts collection for providerAccountId match
      if (!email) {
        const account = await db.collection('accounts').findOne({ providerAccountId: app.userId });
        if (account?.userId) {
          try {
            const userDoc = await db.collection('users').findOne({ _id: new ObjectId(account.userId) });
            if (userDoc) {
              email = userDoc.email;
              name = userDoc.name;
              console.log(`Found user via account for app ${app._id}: ${email}`);
            }
          } catch (e) {}
        }
      }
      
      if (email) {
        await db.collection('recruitment_applications').updateOne(
          { _id: app._id },
          { $set: { userEmail: email, userName: name || email.split('@')[0] } }
        );
        updatedCount++;
      } else {
        console.log(`Could not find email for app ${app._id}, userId: ${app.userId}`);
        skippedCount++;
      }
    }
    
    console.log(`\nDone! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
    
  } finally {
    await client.close();
  }
}

backfillEmails().catch(console.error);
