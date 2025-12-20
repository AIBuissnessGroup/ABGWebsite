import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import crypto from 'crypto';

const client = createMongoClient();

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

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
    await client.connect();
    const db = client.db();
    
    // For admin dashboard, show ALL events (both published and unpublished)
    // and both main events and subevents
    const events = await db.collection('Event')
      .find({}) // No filtering - show everything
      .sort({ featured: -1, eventDate: -1 })
      .toArray();
    
    return corsResponse(NextResponse.json(safeJson(events)));
  } catch (error) {
    console.error('Error fetching events:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 }));
  } finally {
    await client.close();
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
    if (!isAdmin(session.user)) {
      console.log('User is not an admin');
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    await client.connect();
    const db = client.db('abg-website');
    const usersCollection = db.collection('User');
    const eventsCollection = db.collection('Event');

    // Find the user to get their ID
    let user = await usersCollection.findOne({ email: session.user.email });
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found in database');
      // Try to create the user if they don't exist
      try {
        const newUser = {
          id: crypto.randomUUID(),
          email: session.user.email,
          name: session.user.name || '',
          role: isAdmin(session.user) ? 'ADMIN' : 'USER',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const insertResult = await usersCollection.insertOne(newUser);
        user = await usersCollection.findOne({ _id: insertResult.insertedId });
        console.log('Created new user:', user);
      } catch (error) {
        console.error('Error creating user:', error);
        return corsResponse(NextResponse.json({ error: 'Failed to create user' }, { status: 500 }));
      }
    }

    const data = await request.json();
    console.log('Event data:', data);

    // Helper function to hash password with salt
    const hashPassword = (password: string, salt: string): string => {
      return crypto.createHash('sha256').update(salt + password).digest('hex');
    };

    // Handle attendance password
    let attendancePasswordHash = null;
    let attendancePasswordSalt = null;
    
    if (data.attendancePassword) {
      attendancePasswordSalt = crypto.randomBytes(16).toString('hex');
      attendancePasswordHash = hashPassword(data.attendancePassword, attendancePasswordSalt);
    }
    
    const eventData = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : (data.eventDate ? new Date(data.eventDate) : null),
      location: data.location,
      venue: data.venue || null,
      capacity: data.capacity || null,
      registrationUrl: data.registrationUrl || null,
      registrationCtaLabel: data.registrationCtaLabel || 'Register Now',
      registrationEnabled: data.registrationEnabled ? 1 : 0,
      eventType: data.eventType || 'MEETING',
      imageUrl: data.imageUrl || null,
      featured: data.featured ? 1 : 0, // Convert boolean to number
      published: data.published !== undefined ? data.published : true, // Keep as boolean
      parentEventId: data.parentEventId || null,
      isMainEvent: data.parentEventId ? 0 : 1, // Convert boolean to number (0 = false, 1 = true)
      attendanceConfirmEnabled: data.attendanceConfirmEnabled ? 1 : 0,
      attendancePasswordHash,
      attendancePasswordSalt,
      waitlistEnabled: data.waitlistEnabled || false,
      waitlistMaxSize: data.waitlistMaxSize || null,
      waitlistAutoPromote: data.waitlistAutoPromote || false,
      requirePassword: data.requirePassword || false,
      requireName: data.requireName !== undefined ? data.requireName : true,
      requireMajor: data.requireMajor || false,
      requireGradeLevel: data.requireGradeLevel || false,
      requirePhone: data.requirePhone || false,
      customFields: data.customFields || [], // Add custom fields support
      speakers: data.speakers || [], // Add speakers support
      partners: data.partners || [], // Add partners support
      attendees: [], // Initialize empty attendees array
      waitlist: [], // Initialize empty waitlist array
      createdBy: user?.id || crypto.randomUUID(),
      
      // Role-gated registration
      registration: {
        enabled: data.registrationRoleGatingEnabled || false,
        requiredRolesAny: data.requiredRolesAny || []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await eventsCollection.insertOne(eventData);
    const event = { ...eventData, _id: result.insertedId };
    
    console.log('Created event:', event);

    return corsResponse(NextResponse.json(safeJson(event)));
  } catch (error) {
    console.error('Error creating event:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to create event' }, { status: 500 }));
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
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

    await client.connect();
    const db = client.db('abg-website');
    const eventsCollection = db.collection('Event');

    // Check if event exists before updating
    const existingEvent = await eventsCollection.findOne({ id });

    if (!existingEvent) {
      return corsResponse(NextResponse.json({ error: 'Event not found' }, { status: 404 }));
    }

    // Helper function to hash password with salt
    const hashPassword = (password: string, salt: string): string => {
      return crypto.createHash('sha256').update(salt + password).digest('hex');
    };

    // Handle attendance password
    let attendancePasswordHash = existingEvent.attendancePasswordHash;
    let attendancePasswordSalt = existingEvent.attendancePasswordSalt;
    
    if (data.attendancePassword) {
      attendancePasswordSalt = crypto.randomBytes(16).toString('hex');
      attendancePasswordHash = hashPassword(data.attendancePassword, attendancePasswordSalt);
    } else if (data.attendancePassword === '' || data.attendancePassword === null) {
      // Clear password if empty string or null is provided
      attendancePasswordHash = null;
      attendancePasswordSalt = null;
    }
    // If attendancePassword is undefined, keep existing password

    const updateData = {
      title: data.title,
      description: data.description,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      location: data.location || '',
      venue: data.venue || null,
      capacity: data.capacity || null,
      registrationUrl: data.registrationUrl || null,
      eventType: data.eventType || 'MEETING',
      imageUrl: data.imageUrl || null,
      featured: data.featured ? 1 : 0, // Convert boolean to number
      published: data.published !== undefined ? data.published : true, // Keep as boolean
      parentEventId: data.parentEventId || null,
      isMainEvent: data.parentEventId ? 0 : 1, // Convert boolean to number (0 = false, 1 = true)
      attendanceConfirmEnabled: data.attendanceConfirmEnabled ? 1 : 0,
      attendancePasswordHash,
      attendancePasswordSalt,
      waitlistEnabled: data.waitlistEnabled || false,
      waitlistMaxSize: data.waitlistMaxSize || null,
      waitlistAutoPromote: data.waitlistAutoPromote || false,
      requirePassword: data.requirePassword || false,
      requireName: data.requireName !== undefined ? data.requireName : true,
      requireMajor: data.requireMajor || false,
      requireGradeLevel: data.requireGradeLevel || false,
      requirePhone: data.requirePhone || false,
      customFields: data.customFields || [], // Add custom fields support
      speakers: data.speakers || [], // Add speakers support
      partners: data.partners || [], // Add partners support
      
      // Role-gated registration
      registration: {
        enabled: data.registrationRoleGatingEnabled || false,
        requiredRolesAny: data.requiredRolesAny || []
      },
      
      updatedAt: new Date()
    };

    const result = await eventsCollection.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    const event = result;

    console.log('Event updated successfully:', { id: event?.id, title: event?.title });
    return corsResponse(NextResponse.json(safeJson(event)));
  } catch (error) {
    console.error('Error updating event:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to update event' }, { status: 500 }));
  } finally {
    await client.close();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return corsResponse(NextResponse.json({ error: 'Event ID required' }, { status: 400 }));
    }

    await client.connect();
    const db = client.db('abg-website');
    const eventsCollection = db.collection('Event');

    const result = await eventsCollection.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return corsResponse(NextResponse.json({ error: 'Event not found' }, { status: 404 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting event:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to delete event' }, { status: 500 }));
  } finally {
    await client.close();
  }
} 