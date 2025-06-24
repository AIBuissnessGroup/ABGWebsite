import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();
    
    // Get the countdown display mode setting
    const displayModeSetting = await prisma.siteSettings.findUnique({
      where: { key: 'countdown_display_mode' }
    });
    
    const displayMode = displayModeSetting?.value || 'next_event';
    
    // Build the where clause based on display mode
    const whereClause: any = {
      eventDate: {
        gte: now
      },
      published: true
    };
    
    if (displayMode === 'next_featured') {
      whereClause.featured = true;
    }
    
    // Get the next upcoming event
    const nextEvent = await prisma.event.findFirst({
      where: whereClause,
      include: {
        partnerships: {
          include: {
            company: true
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    if (!nextEvent) {
      return NextResponse.json(null);
    }

    // Format the event data for the countdown component
    const formattedEvent = {
      id: nextEvent.id,
      title: nextEvent.title,
      description: nextEvent.description,
      eventDate: nextEvent.eventDate.toISOString(),
      location: nextEvent.location || 'TBD',
      venue: nextEvent.venue,
      registrationUrl: nextEvent.registrationUrl || '/events',
      partnerships: (nextEvent as any).partnerships || []
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching next event:', error);
    return NextResponse.json({ error: 'Failed to fetch next event' }, { status: 500 });
  }
} 