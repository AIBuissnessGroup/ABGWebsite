import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';




export async function GET() {
  try {
    
    
    const db = await getDb();
    
    // Get events collection structure
    const eventsCollection = db.collection('Event');
    const sampleEvent = await eventsCollection.findOne({});
    const eventsCount = await eventsCollection.countDocuments();
    
    // Check for related collections
    const collections = await db.listCollections().toArray();
    const allCollectionNames = collections.map(col => col.name);
    
    // Get a few sample events to understand the structure
    const sampleEvents = await eventsCollection.find({}).limit(3).toArray();
    
    
    
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