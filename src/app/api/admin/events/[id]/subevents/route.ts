import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

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

// GET all subevents for a parent event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subevents = await prisma.event.findMany({
      where: {
        parentEventId: params.id,
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
    });

    return corsResponse(NextResponse.json(subevents));
  } catch (error) {
    console.error('Error fetching subevents:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch subevents' }, { status: 500 }));
  }
}

// POST - Create a new subevent
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    // Find the user to get their ID
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          role: adminEmails.includes(session.user.email) ? 'ADMIN' : 'USER'
        }
      });
    }

    // Verify parent event exists and is a main event
    const parentEvent = await prisma.event.findUnique({
      where: { id: params.id }
    });

    if (!parentEvent) {
      return corsResponse(NextResponse.json({ error: 'Parent event not found' }, { status: 404 }));
    }

    if (!parentEvent.isMainEvent) {
      return corsResponse(NextResponse.json({ error: 'Cannot create subevent under another subevent' }, { status: 400 }));
    }

    const data = await request.json();
    
    const subevent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || parentEvent.location,
        venue: data.venue || null,
        capacity: data.capacity || null,
        registrationUrl: data.registrationUrl || null,
        eventType: data.eventType || 'MEETING',
        imageUrl: data.imageUrl || null,
        featured: false, // Subevents are typically not featured
        published: data.published !== undefined ? data.published : true,
        parentEventId: params.id,
        isMainEvent: false,
        createdBy: user.id
      }
    });

    return corsResponse(NextResponse.json(subevent));
  } catch (error) {
    console.error('Error creating subevent:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to create subevent' }, { status: 500 }));
  }
} 