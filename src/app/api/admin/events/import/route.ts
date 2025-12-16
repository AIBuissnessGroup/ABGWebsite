import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';
import { requireAdminSession } from '@/lib/server-admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const usersCollection = db.collection('User');
    const eventsCollection = db.collection('Event');

    // Find the user to get their ID
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.title || !record.description || !record.eventDate || !record.location || !record.eventType) {
          errors.push(`Missing required fields for record: ${JSON.stringify(record)}`);
          continue;
        }

        // Validate event type (simplified validation)
        const validEventTypes = ['MEETING', 'WORKSHOP', 'CONFERENCE', 'NETWORKING', 'OTHER'];
        if (!validEventTypes.includes(record.eventType)) {
          errors.push(`Invalid event type "${record.eventType}" for record: ${JSON.stringify(record)}`);
          continue;
        }

        const eventData = {
          id: crypto.randomUUID(),
          title: record.title,
          description: record.description,
          eventDate: new Date(record.eventDate),
          endDate: record.endDate ? new Date(record.endDate) : null,
          location: record.location,
          venue: record.venue || null,
          capacity: record.capacity ? parseInt(record.capacity) : null,
          registrationUrl: record.registrationUrl || null,
          eventType: record.eventType,
          imageUrl: record.imageUrl || null,
          featured: record.featured === 'true' ? 1 : 0,
          published: record.published !== 'false',
          isMainEvent: 1,
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await eventsCollection.insertOne(eventData);
        const event = { ...eventData, _id: result.insertedId };

        results.push(event);
      } catch (error: any) {
        errors.push(`Error processing record ${JSON.stringify(record)}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results
    });

  } catch (error: any) {
    console.error('Error importing events:', error);
    return NextResponse.json({ 
      error: 'Failed to import events',
      details: error.message
    }, { status: 500 });
  } finally {
    await client.close();
  }
} 
