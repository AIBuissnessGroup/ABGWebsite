import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

const prisma = new PrismaClient();

// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { 
        published: true,
        isMainEvent: true // Only fetch main events, subevents will be included via relation
      },
      include: {
        partnerships: {
          include: {
            company: true
          }
        },
        subevents: {
          where: { published: true },
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
      orderBy: [
        { featured: 'desc' },
        { eventDate: 'desc' }
      ]
    });

    return corsResponse(NextResponse.json(events));
  } catch (error) {
    console.error('Error fetching events:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in POST /api/admin/events:', session);
    
    if (!session?.user?.email) {
      console.log('No user email in session');
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      console.log('User is not an admin');
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    // Find the user to get their ID
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found in database');
      // Try to create the user if they don't exist
      try {
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || '',
            role: isAdminEmail(session.user.email) ? 'ADMIN' : 'USER'
          }
        });
        console.log('Created new user:', user);
      } catch (error) {
        console.error('Error creating user:', error);
        return corsResponse(NextResponse.json({ error: 'Failed to create user' }, { status: 500 }));
      }
    }

    const data = await request.json();
    console.log('Event data:', data);
    
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        venue: data.venue || null,
        capacity: data.capacity || null,
        registrationUrl: data.registrationUrl || null,
        eventType: data.eventType || 'MEETING',
        imageUrl: data.imageUrl || null,
        featured: data.featured || false,
        published: data.published !== undefined ? data.published : true,
        parentEventId: data.parentEventId || null,
        isMainEvent: data.parentEventId ? false : true,
        createdBy: user.id
      }
    });
    console.log('Created event:', event);

    return corsResponse(NextResponse.json(event));
  } catch (error) {
    console.error('Error creating event:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to create event' }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    // Get ID from URL parameter or request body
    const { searchParams } = new URL(request.url);
    const urlId = searchParams.get('id');
    
    const data = await request.json();
    const id = urlId || data.id;

    console.log('PUT request data:', { urlId, bodyId: data.id, id, data });

    if (!id) {
      return corsResponse(NextResponse.json({ error: 'Event ID is required' }, { status: 400 }));
    }
    
    // Validate required fields
    if (!data.title || !data.description) {
      return corsResponse(NextResponse.json({ error: 'Title and description are required' }, { status: 400 }));
    }

    if (!data.eventDate) {
      return corsResponse(NextResponse.json({ error: 'Event date is required' }, { status: 400 }));
    }

    // Check if event exists before updating
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return corsResponse(NextResponse.json({ error: 'Event not found' }, { status: 404 }));
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || '',
        venue: data.venue || null,
        capacity: data.capacity || null,
        registrationUrl: data.registrationUrl || null,
        eventType: data.eventType || 'MEETING',
        imageUrl: data.imageUrl || null,
        featured: data.featured || false,
        published: data.published !== undefined ? data.published : true,
        parentEventId: data.parentEventId || null,
        isMainEvent: data.parentEventId ? false : true
      }
    });

    console.log('Event updated successfully:', { id: event.id, title: event.title });
    return corsResponse(NextResponse.json(event));
  } catch (error) {
    console.error('Error updating event:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to update event' }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return corsResponse(NextResponse.json({ error: 'Event ID required' }, { status: 400 }));
    }

    await prisma.event.delete({
      where: { id }
    });

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting event:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to delete event' }, { status: 500 }));
  }
} 