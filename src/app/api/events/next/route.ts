import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

export async function GET() {
  try {
    await client.connect();
    const db = client.db('abg-website');
    
    const now = new Date();
    
    // Get the next upcoming main event with partnerships and subevents
    const nextEventResults = await db.collection('Event').aggregate([
      { 
        $match: { 
          eventDate: { $gte: now },
          published: true,
          $or: [
            { isMainEvent: true },
            { isMainEvent: 1 },
            { isMainEvent: { $exists: false } }
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
      { $unset: 'partnershipCompanies' },
      { $sort: { featured: -1, eventDate: 1 } },
      { $limit: 1 }
    ]).toArray();

    const nextEvent = nextEventResults[0] || null;
    
    if (!nextEvent) {
      return NextResponse.json(null);
    }

    // Format the event data for the countdown component including partnerships and subevents
    const formattedEvent = {
      id: nextEvent.id,
      title: nextEvent.title,
      description: nextEvent.description,
      eventDate: nextEvent.eventDate,
      location: nextEvent.location || 'TBD',
      venue: nextEvent.venue,
      registrationUrl: nextEvent.registrationUrl || '/events',
      registrationEnabled: nextEvent.registrationEnabled,
      registrationCtaLabel: nextEvent.registrationCtaLabel,
      backgroundImageUrl: nextEvent.imageUrl,
      partnerships: nextEvent.partnerships || [],
      subevents: nextEvent.subevents || [],
      slug: nextEvent.slug
    };

    return NextResponse.json(safeJson(formattedEvent));
  } catch (error) {
    console.error('Error fetching next event:', error);
    return NextResponse.json({ error: 'Failed to fetch next event' }, { status: 500 });
  } finally {
    await client.close();
  }
}