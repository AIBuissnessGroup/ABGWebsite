import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
    await client.connect();
    const db = client.db();
    
    const events = await db.collection('Event').find({ 
      published: true 
    }).toArray();
    
    await client.close();
    
    const eventData = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      slug: event.slug || generateSlug(event.title),
      eventDate: event.eventDate,
      url: `/events/${event.slug || generateSlug(event.title)}`,
      published: event.published,
      featured: event.featured
    }));
    
    return NextResponse.json({
      totalEvents: events.length,
      events: eventData.sort((a, b) => b.eventDate - a.eventDate) // Sort by date, newest first
    });
    
  } catch (error) {
    console.error('Events debug error:', error);
    return NextResponse.json({ error: 'Failed to get events debug info' }, { status: 500 });
  }
}