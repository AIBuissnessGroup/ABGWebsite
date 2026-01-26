#!/usr/bin/env node
/**
 * Fix the phase config index to support track-specific configurations
 * Run with: node scripts/fix-phase-config-index.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function fixIndex() {
  const connString = process.env.DATABASE_URL;
  if (!connString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  console.log('Connecting to database...');
  
  const client = new MongoClient(connString, {
    tls: true,
    tlsAllowInvalidCertificates: true, // For local dev
  });
  
  try {
    await client.connect();
    console.log('Connected!');
    
    const db = client.db();
    const collection = db.collection('recruitment_phase_configs');
    
    // List current indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    
    // Check if new index already exists
    const hasNewIndex = indexes.some(i => i.name === 'cycleId_1_phase_1_track_1');
    
    if (hasNewIndex) {
      console.log('\n✓ Index cycleId_1_phase_1_track_1 already exists');
      return;
    }
    
    // Drop the old index if it exists
    const hasOldIndex = indexes.some(i => i.name === 'cycleId_1_phase_1');
    if (hasOldIndex) {
      await collection.dropIndex('cycleId_1_phase_1');
      console.log('\n✓ Dropped old index: cycleId_1_phase_1');
    }
    
    // Create new compound index that includes track
    await collection.createIndex(
      { cycleId: 1, phase: 1, track: 1 },
      { unique: true, sparse: true, name: 'cycleId_1_phase_1_track_1' }
    );
    console.log('✓ Created new index: cycleId_1_phase_1_track_1');
    
    // Verify
    console.log('\nUpdated indexes:');
    const newIndexes = await collection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));
    
    console.log('\n✅ Index migration complete!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixIndex();
