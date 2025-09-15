// Migration script to add slugs to existing events
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

async function addSlugsToEvents() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const eventsCollection = db.collection('Event');
    
    // Get all events without slugs
    const events = await eventsCollection.find({ slug: { $exists: false } }).toArray();
    console.log(`Found ${events.length} events without slugs`);
    
    const bulkOps = [];
    const slugMap = new Map();
    
    for (const event of events) {
      let baseSlug = generateSlug(event.title);
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug uniqueness
      while (slugMap.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      slugMap.set(slug, event._id);
      
      bulkOps.push({
        updateOne: {
          filter: { _id: event._id },
          update: { $set: { slug: slug } }
        }
      });
      
      console.log(`${event.title} -> ${slug}`);
    }
    
    if (bulkOps.length > 0) {
      const result = await eventsCollection.bulkWrite(bulkOps);
      console.log(`Updated ${result.modifiedCount} events with slugs`);
    } else {
      console.log('No events to update');
    }
    
  } catch (error) {
    console.error('Error adding slugs:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addSlugsToEvents();