import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import ical from 'node-ical';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

function corsResponse(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  return corsResponse(NextResponse.json({ ok: true }));
}

async function handleSync(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cal-sync-secret') || request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CAL_SYNC_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const icsUrl = process.env.GOOGLE_CALENDAR_ICS_URL;
    if (!icsUrl) {
      return corsResponse(NextResponse.json({ error: 'Missing GOOGLE_CALENDAR_ICS_URL' }, { status: 400 }));
    }

    // Choose a user to attribute createdBy
    const createdByEmail = process.env.SYNC_CREATED_BY_EMAIL || process.env.DEFAULT_ADMIN_EMAIL || (process.env.ADMIN_EMAILS?.split(',')[0] || '').trim();
    if (!createdByEmail) {
      return corsResponse(NextResponse.json({ error: 'Missing SYNC_CREATED_BY_EMAIL or ADMIN_EMAILS' }, { status: 500 }));
    }

    await client.connect();
    const db = client.db('abg-website');
    const usersCollection = db.collection('User');
    const eventsCollection = db.collection('Event');

    const creator = await usersCollection.findOne({ email: createdByEmail });
    if (!creator) {
      return corsResponse(NextResponse.json({ error: `User not found for email ${createdByEmail}` }, { status: 404 }));
    }

    const data = await ical.async.fromURL(icsUrl);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const key of Object.keys(data)) {
      const item = (data as any)[key];
      if (!item || item.type !== 'VEVENT') continue;

      const title: string = item.summary || 'Untitled Event';
      const description: string = item.description || '';
      const location: string = item.location || 'TBD';
      const start: Date | undefined = item.start ? new Date(item.start) : undefined;
      const end: Date | undefined = item.end ? new Date(item.end) : undefined;

      if (!start) {
        errors.push(`Skipping event without start: ${title}`);
        continue;
      }

      // Use a stable dedupe key: title + start + location
      try {
        const existing = await eventsCollection.findOne({
          title,
          eventDate: start,
          location
        });

        if (existing) {
          await eventsCollection.updateOne(
            { id: existing.id },
            {
              $set: {
                description,
                endDate: end ?? null,
                venue: existing.venue || null,
                registrationUrl: existing.registrationUrl || null,
                imageUrl: existing.imageUrl || null,
                published: true,
                updatedAt: new Date()
              }
            }
          );
          updated += 1;
        } else {
          const eventData = {
            id: crypto.randomUUID(),
            title,
            description,
            eventDate: start,
            endDate: end ?? null,
            location,
            venue: null,
            capacity: null,
            registrationUrl: null,
            eventType: 'MEETING',
            imageUrl: null,
            featured: 0,
            published: true,
            parentEventId: null,
            isMainEvent: 1,
            createdBy: creator.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await eventsCollection.insertOne(eventData);
          created += 1;
        }
      } catch (e: any) {
        errors.push(`Error upserting event "${title}": ${e.message}`);
      }
    }

    return corsResponse(NextResponse.json({ success: true, created, updated, errors: errors.length ? errors : undefined }));
  } catch (error: any) {
    console.error('Error syncing Google Calendar:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to sync events', details: error.message }, { status: 500 }));
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}


