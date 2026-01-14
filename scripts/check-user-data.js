/**
 * Check user data in database to debug the Unknown user issue
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient(process.env.DATABASE_URL, {
    tls: true,
    tlsCAFile: process.env.NODE_ENV === 'production' ? '/app/global-bundle.pem' : undefined,
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production'
  });

  try {
    await client.connect();
    console.log('Connected to database');
    const db = client.db();
    
    // Get a sample application
    const apps = await db.collection('recruitment_applications')
      .find({})
      .limit(3)
      .toArray();
    
    console.log('\n=== SAMPLE APPLICATIONS ===');
    for (const app of apps) {
      console.log({
        _id: app._id.toString(),
        userId: app.userId,
        userEmail: app.userEmail,
        userName: app.userName,
        track: app.track,
        stage: app.stage
      });
    }
    
    // Get sample users to see the structure
    const users = await db.collection('users')
      .find({})
      .limit(5)
      .toArray();
    
    console.log('\n=== SAMPLE USERS ===');
    for (const user of users) {
      console.log({
        _id: user._id?.toString(),
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        id: user.id
      });
    }
    
    // Check if any users have googleId
    const usersWithGoogleId = await db.collection('users').countDocuments({ googleId: { $exists: true } });
    console.log(`\nUsers with googleId: ${usersWithGoogleId}`);
    
    // Try to find a user for the first application
    if (apps.length > 0) {
      const app = apps[0];
      console.log(`\n=== TRYING TO FIND USER FOR APP userId: ${app.userId} ===`);
      
      // Try by googleId
      const byGoogleId = await db.collection('users').findOne({ googleId: app.userId });
      console.log('By googleId:', byGoogleId ? { email: byGoogleId.email, name: byGoogleId.name } : 'NOT FOUND');
      
      // Try by id field
      const byId = await db.collection('users').findOne({ id: app.userId });
      console.log('By id field:', byId ? { email: byId.email, name: byId.name } : 'NOT FOUND');
      
      // Check bookings
      const booking = await db.collection('recruitment_bookings').findOne({ 
        applicationId: app._id.toString(),
        applicantEmail: { $exists: true }
      });
      console.log('From bookings:', booking ? { email: booking.applicantEmail, name: booking.applicantName } : 'NOT FOUND');
    }
    
    console.log('\nDone!');
  } finally {
    await client.close();
  }
}

checkData().catch(console.error);
