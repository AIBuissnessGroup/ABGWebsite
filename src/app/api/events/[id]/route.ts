import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { Event } from '../../../../types/events';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Try to find event by different methods
    let event = null;

    // First, try by direct ID
    event = await db.collection('Event').findOne({ id: eventId });

    // If not found, try by slug
    if (!event) {
      event = await db.collection('Event').findOne({ slug: eventId });
    }

    // If still not found, try to generate slug from title and match
    if (!event) {
      const allEvents = await db.collection('Event').find({}).toArray();
      event = allEvents.find((e: any) => generateSlug(e.title) === eventId);
    }

    await client.close();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Add generated slug if it doesn't exist
    if (!event.slug) {
      event.slug = generateSlug(event.title);
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Failed to get event' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Generate slug if title is being updated
    if (body.title && !body.slug) {
      body.slug = generateSlug(body.title);
    }

    // Update timestamp
    body.updatedAt = Date.now();

    const result = await db.collection('Event').updateOne(
      { id: id },
      { $set: body }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}