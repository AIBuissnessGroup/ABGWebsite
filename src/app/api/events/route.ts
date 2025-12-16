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

export async function GET(request: NextRequest) {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
    const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});
    await client.connect();
    const db = client.db();

    const { searchParams } = new URL(request.url);
    const eventTypeFilter = searchParams.get('eventType');
    
    // Debug: Check what the match stage actually finds
    const matchStage: any = { 
      $or: [
        { published: true },          // Boolean true
        { published: 1 }              // Number 1
      ],
      $and: [
        {
          $or: [
            { isMainEvent: true },        // Boolean true
            { isMainEvent: 1 },           // Number 1 
            { isMainEvent: { $exists: false } } // Include events without isMainEvent field
          ]
        }
      ]
    };

    // Add eventType filter if provided
    if (eventTypeFilter) {
      matchStage.eventType = eventTypeFilter;
    }
    
    const matchCount = await db.collection('Event').countDocuments(matchStage);
    console.log('Events matching filter:', matchCount, 'eventType:', eventTypeFilter);
    
    // Get all published main events with partnerships and subevents
    const pipeline = [
      { 
        $match: matchStage
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
      { $project: { partnershipCompanies: 0 } },
      { $sort: { featured: -1, eventDate: 1 } }
    ];
    
    const events = await db.collection('Event').aggregate(pipeline).toArray();
    console.log('Events after aggregation:', events.length);

    await client.close();
    return corsResponse(NextResponse.json(events));
  } catch (error) {
    console.error('Error fetching events:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 }));
  }
}
