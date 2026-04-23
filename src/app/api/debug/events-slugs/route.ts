import { getDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';




function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    
    
    const db = await getDb();
    
    const events = await db.collection('Event').find({ 
      published: true 
    }).toArray();
    
    
    
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