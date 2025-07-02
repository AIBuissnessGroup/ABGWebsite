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
    
    // First, get all upcoming events (main events with their subevents)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        ...whereClause,
        isMainEvent: true
      },
      include: {
        partnerships: {
          include: {
            company: true
          }
        },
        subevents: {
          where: {
            eventDate: { gte: now },
            published: true
          },
          include: {
            partnerships: {
              include: {
                company: true
              }
            }
          },
          orderBy: { eventDate: 'asc' }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    // Find the next event to display in countdown
    let nextEvent = null;
    
    for (const event of upcomingEvents) {
      // Always use the main event for countdown, include subevents as additional info
      if (new Date(event.eventDate) >= now) {
        nextEvent = {
          ...event,
          // Include all subevents for this main event
          subevents: event.subevents || []
        };
        break;
      }
    }

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
      partnerships: (nextEvent as any).partnerships || [],
      // Include subevents for this main event (limit to next 2 upcoming)
      subevents: (nextEvent as any).subevents ? 
        (nextEvent as any).subevents.slice(0, 2).map((sub: any) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          eventDate: sub.eventDate.toISOString(),
          venue: sub.venue,
          eventType: sub.eventType
        })) : []
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching next event:', error);
    return NextResponse.json({ error: 'Failed to fetch next event' }, { status: 500 });
  }
} 