import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

export async function GET() {
  try {
    const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
    await client.connect();
    const db = client.db();
    
    // Get events collection structure
    const eventsCollection = db.collection('Event');
    const sampleEvent = await eventsCollection.findOne({});
    const eventsCount = await eventsCollection.countDocuments();
    
    // Check for related collections
    const collections = await db.listCollections().toArray();
    const allCollectionNames = collections.map(col => col.name);
    
    // Get a few sample events to understand the structure
    const sampleEvents = await eventsCollection.find({}).limit(3).toArray();
    
    await client.close();
    
    return NextResponse.json({
      eventsCount,
      sampleEvent,
      sampleEvents,
      allCollections: allCollectionNames,
      eventSchema: sampleEvent ? Object.keys(sampleEvent) : []
    });
    
  } catch (error) {
    console.error('Events structure inspection error:', error);
    return NextResponse.json({ error: 'Failed to inspect events structure' }, { status: 500 });
  }
}