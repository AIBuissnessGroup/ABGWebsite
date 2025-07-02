import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient, EventType } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the user to get their ID
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

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

        // Validate event type
        if (!Object.values(EventType).includes(record.eventType)) {
          errors.push(`Invalid event type "${record.eventType}" for record: ${JSON.stringify(record)}`);
          continue;
        }

        const event = await prisma.event.create({
          data: {
            title: record.title,
            description: record.description,
            eventDate: new Date(record.eventDate),
            endDate: record.endDate ? new Date(record.endDate) : null,
            location: record.location,
            venue: record.venue || null,
            capacity: record.capacity ? parseInt(record.capacity) : null,
            registrationUrl: record.registrationUrl || null,
            eventType: record.eventType as EventType,
            imageUrl: record.imageUrl || null,
            featured: record.featured === 'true' || false,
            published: record.published !== 'false',
            createdBy: user.id
          }
        });

        results.push(event);
      } catch (error) {
        errors.push(`Error processing record ${JSON.stringify(record)}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results
    });

  } catch (error) {
    console.error('Error importing events:', error);
    return NextResponse.json({ 
      error: 'Failed to import events',
      details: error.message
    }, { status: 500 });
  }
} 