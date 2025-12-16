import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdminSession();
  if (!session) {
    return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }
  try {
    const client = new MongoClient(process.env.DATABASE_URL!, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
    await client.connect();
    const db = client.db();

    // Get subevents with partnerships
    const subevents = await db.collection('Event').aggregate([
      { 
        $match: { 
          parentEventId: id,
          published: true 
        } 
      },
      {
        $lookup: {
          from: 'EventPartnership',
          localField: 'id',
          foreignField: 'eventId',
          as: 'partnerships'
        }
      },
      {
        $lookup: {
          from: 'Company',
          localField: 'partnerships.companyId',
          foreignField: 'id',
          as: 'partnershipCompanies'
        }
      },
      {
        $addFields: {
          partnerships: {
            $map: {
              input: '$partnerships',
              as: 'partnership',
              in: {
                $mergeObjects: [
                  '$$partnership',
                  {
                    company: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$partnershipCompanies',
                            cond: { $eq: ['$$this.id', '$$partnership.companyId'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      { $unset: 'partnershipCompanies' },
      { $sort: { eventDate: 1 } }
    ]).toArray();

    await client.close();
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
    const { id } = await params; // Await params before accessing properties
    const session = await requireAdminSession();
    
    if (!session) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const client = new MongoClient(process.env.DATABASE_URL!, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
    await client.connect();
    const db = client.db();

    // Find the user to get their ID
    let user = await db.collection('User').findOne({ email: session.user.email });

    if (!user) {
      const newUser = {
        id: `user-${Date.now()}`,
        email: session.user.email,
        name: session.user.name || '',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('User').insertOne(newUser);
      user = newUser;
    }

    // Verify parent event exists and is a main event
    const parentEvent = await db.collection('Event').findOne({ id: id });

    if (!parentEvent) {
      await client.close();
      return corsResponse(NextResponse.json({ error: 'Parent event not found' }, { status: 404 }));
    }

    if (!parentEvent.isMainEvent) {
      await client.close();
      return corsResponse(NextResponse.json({ error: 'Cannot create subevent under another subevent' }, { status: 400 }));
    }

    const data = await request.json();
    
    const subevent = {
      id: `event-${Date.now()}`,
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
      parentEventId: id,
      isMainEvent: false,
      createdBy: user?.id || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('Event').insertOne(subevent);
    await client.close();

    return corsResponse(NextResponse.json(subevent));
  } catch (error) {
    console.error('Error creating subevent:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to create subevent' }, { status: 500 }));
  }
} 
