import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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
    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    const db = client.db();
    
    // Get all published main events with partnerships and subevents
    const events = await db.collection('Event').aggregate([
      { 
        $match: { 
          published: true,
          $or: [
            { isMainEvent: true },
            { isMainEvent: { $exists: false } } // Include events without isMainEvent field
          ]
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
      {
        $lookup: {
          from: 'Event',
          localField: 'id',
          foreignField: 'parentEventId',
          as: 'subevents'
        }
      },
      {
        $addFields: {
          subevents: {
            $map: {
              input: '$subevents',
              as: 'subevent',
              in: {
                $mergeObjects: [
                  '$$subevent',
                  {
                    partnerships: []
                  }
                ]
              }
            }
          }
        }
      },
      { $unset: 'partnershipCompanies' },
      { $sort: { featured: -1, eventDate: 1 } }
    ]).toArray();

    await client.close();
    return corsResponse(NextResponse.json(events));
  } catch (error) {
    console.error('Error fetching events:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 }));
  }
}
