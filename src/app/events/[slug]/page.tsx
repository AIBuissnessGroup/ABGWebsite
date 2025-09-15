import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import EventDetailPage from "../../../components/events/EventDetailPage";
import { Event, EventAttendance } from "../../../types/events";
import { MongoClient } from "mongodb";

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{}>;
}

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    console.log('Looking for event with slug:', slug);
    
    // Use aggregation pipeline to get event with partnerships and company data
    const pipeline = [
      {
        $match: {
          $and: [
            {
              $or: [
                { slug: slug },
                { id: slug }
              ]
            },
            {
              $or: [
                { published: true },
                { published: 1 }
              ]
            }
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
      { $unset: 'partnershipCompanies' }
    ];
    
    let events = await db.collection('Event').aggregate(pipeline).toArray();
    let event = events[0] || null;
    
    console.log('Aggregation pipeline result:');
    console.log('- Events found:', events.length);
    console.log('- Pipeline query:', JSON.stringify(pipeline[0].$match, null, 2));
    if (event) {
      console.log('- Event title:', event.title);
      console.log('- Event attendanceConfirmEnabled:', event.attendanceConfirmEnabled);
      console.log('- Event registrationEnabled:', event.registrationEnabled);
      console.log('- All event fields:', Object.keys(event));
    } else {
      console.log('- No event found by aggregation pipeline');
    }
    
    console.log('Initial aggregation found events:', events.length);
    if (event) {
      console.log('Found event via aggregation:', event.title, 'attendanceConfirmEnabled:', event.attendanceConfirmEnabled);
    }
    
    if (!event) {
      // Try to find by generated slug from title
      const allEvents = await db.collection('Event').find({ 
        $or: [
          { published: true },
          { published: 1 }
        ]
      }).toArray();
      
      console.log('Fallback: Searching through', allEvents.length, 'events for slug match');
      console.log('Sample event fields:', allEvents[0] ? Object.keys(allEvents[0]) : 'No events found');
      
      const foundEvent = allEvents.find((e: any) => {
        const generatedSlug = generateSlug(e.title);
        console.log('Comparing slug:', generatedSlug, 'with target:', slug);
        return generatedSlug === slug;
      });
      
      if (foundEvent) {
        console.log('Found matching event:', foundEvent.title);
        console.log('foundEvent attendanceConfirmEnabled:', foundEvent.attendanceConfirmEnabled);
        console.log('foundEvent registrationEnabled:', foundEvent.registrationEnabled);
        
        // Get partnerships for the found event
        const eventWithPartnerships = await db.collection('Event').aggregate([
          { $match: { id: foundEvent.id } },
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
          { $unset: 'partnershipCompanies' }
        ]).toArray();
        
        event = eventWithPartnerships[0] || foundEvent;
      }
      
      // If still not found, try partial matches for better UX
      if (!event) {
        console.log('No exact match found, looking for partial matches...');
        const slugWords = slug.split('-');
        const partialMatches = allEvents.filter((e: any) => {
          const eventSlug = generateSlug(e.title);
          const eventWords = eventSlug.split('-');
          // Check if at least 3 words match
          const matchingWords = slugWords.filter(word => 
            eventWords.some(eventWord => eventWord.includes(word) || word.includes(eventWord))
          );
          return matchingWords.length >= Math.min(3, slugWords.length);
        });
        
        if (partialMatches.length > 0) {
          console.log('Found partial matches:', partialMatches.map((e: any) => e.title));
          // Return the most recent event from partial matches with partnerships
          const bestMatch = partialMatches.sort((a: any, b: any) => b.eventDate - a.eventDate)[0];
          console.log('Using best partial match:', bestMatch.title);
          
          const eventWithPartnerships = await db.collection('Event').aggregate([
            { $match: { id: bestMatch.id } },
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
            { $unset: 'partnershipCompanies' }
          ]).toArray();
          
          event = eventWithPartnerships[0] || bestMatch;
        }
      }
    }
    
    await client.close();
    
    if (event) {
      console.log('Found event:', event.title);
      console.log('Event partnerships:', event.partnerships?.length || 0);
      // Add generated slug if it doesn't exist
      if (!event.slug) {
        event.slug = generateSlug(event.title);
      }
    } else {
      console.log('No event found for slug:', slug);
    }
    
    return event as Event | null;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

async function getEventStats(eventId: string) {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    const confirmedCount = await db.collection('EventAttendance').countDocuments({
      eventId: eventId,
      status: 'confirmed'
    });
    
    const waitlistCount = await db.collection('EventAttendance').countDocuments({
      eventId: eventId,
      status: 'waitlisted'
    });
    
    await client.close();
    
    return { confirmedCount, waitlistCount };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return { confirmedCount: 0, waitlistCount: 0 };
  }
}

async function getUserRegistration(eventId: string, email?: string): Promise<EventAttendance | null> {
  if (!email) return null;
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    // Check both possible email field patterns
    const registration = await db.collection('EventAttendance').findOne({
      eventId: eventId,
      $or: [
        { email: email },
        { 'attendee.umichEmail': email }
      ]
    });
    
    await client.close();
    
    if (!registration) return null;
    
    // Map the database fields to the expected EventAttendance interface
    const mappedRegistration: EventAttendance = {
      id: registration.id || registration._id.toString(),
      eventId: registration.eventId,
      attendee: {
        name: registration.name,
        umichEmail: registration.email || registration.attendee?.umichEmail,
        major: registration.major || registration.attendee?.major,
        gradeLevel: registration.gradeLevel || registration.attendee?.gradeLevel,
        phone: registration.phone || registration.attendee?.phone,
      },
      status: registration.status || 'confirmed', // Default to confirmed if no status
      registeredAt: registration.confirmedAt ? new Date(registration.confirmedAt).getTime() : Date.now(),
      confirmedAt: registration.confirmedAt ? new Date(registration.confirmedAt).getTime() : undefined,
      waitlistPosition: registration.waitlistPosition,
      source: registration.source || 'website',
      reminders: {
        emailSent: false,
        smsSent: false,
        lastReminderSent: undefined
      }
    };
    
    return mappedRegistration;
  } catch (error) {
    console.error('Error fetching user registration:', error);
    return null;
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  
  if (!event) {
    return {
      title: "Event Not Found - AI Business Group",
    };
  }
  
  return {
    title: `${event.title} - AI Business Group | University of Michigan`,
    description: event.description.slice(0, 160) + (event.description.length > 160 ? '...' : ''),
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.imageUrl ? [{ url: event.imageUrl }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  };
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  // Get user session
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email || undefined;
  
  const { slug } = await params;
  
  console.log('EventPage Debug:');
  console.log('- Slug:', slug);
  console.log('- User session:', session ? 'logged in' : 'not logged in');
  console.log('- User email from session:', userEmail);
  
  const rawEvent = await getEvent(slug);
  
  if (!rawEvent) {
    notFound();
  }

  // Type assertion for database event with legacy fields
  const dbEvent = rawEvent as any;
  
  // Get event statistics for waitlist info
  const eventStats = await getEventStats(dbEvent.id);

  // Serialize the event data for client components
  const serializedEvent: Event = {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    eventDate: typeof dbEvent.eventDate === 'string' ? new Date(dbEvent.eventDate).getTime() : dbEvent.eventDate,
    endDate: dbEvent.endDate ? (typeof dbEvent.endDate === 'string' ? new Date(dbEvent.endDate).getTime() : dbEvent.endDate) : undefined,
    location: dbEvent.location,
    venue: dbEvent.venue,
    capacity: dbEvent.capacity,
    registrationUrl: dbEvent.registrationUrl,
    registrationCtaLabel: dbEvent.registrationCtaLabel,
    eventType: dbEvent.eventType,
    imageUrl: dbEvent.imageUrl,
    featured: dbEvent.featured,
    published: dbEvent.published,
    parentEventId: dbEvent.parentEventId,
    isMainEvent: dbEvent.isMainEvent,
    createdAt: typeof dbEvent.createdAt === 'string' ? new Date(dbEvent.createdAt).getTime() : dbEvent.createdAt,
    updatedAt: dbEvent.updatedAt ? (typeof dbEvent.updatedAt === 'string' ? new Date(dbEvent.updatedAt).getTime() : dbEvent.updatedAt) : Date.now(),
    createdBy: dbEvent.createdBy,
    slug: dbEvent.slug,
    speakers: dbEvent.speakers || [],
    // Add the registration/attendance fields that the component expects
    registrationEnabled: dbEvent.registrationEnabled,
    attendanceConfirmEnabled: dbEvent.attendanceConfirmEnabled,
    // Set up waitlist configuration
    waitlist: {
      enabled: Boolean(dbEvent.waitlistEnabled),
      maxSize: dbEvent.waitlistMaxSize,
      autoPromote: Boolean(dbEvent.waitlistAutoPromote),
      currentSize: eventStats.waitlistCount
    },
    // Transform partnerships to partners format expected by EventDetailPage
    partners: dbEvent.partnerships ? dbEvent.partnerships.map((partnership: any) => ({
      id: partnership.company?.id || partnership.companyId,
      name: partnership.company?.name || 'Unknown Company',
      logo: partnership.company?.logoUrl,
      type: partnership.type,
      description: partnership.description,
      sponsorshipLevel: partnership.sponsorshipLevel,
      website: partnership.company?.website
    })) : [],
    // Set up attendance confirmation based on database fields
    attendanceConfirmation: {
      enabled: Boolean(dbEvent.attendanceConfirmEnabled),
      requiresPassword: Boolean(dbEvent.attendancePasswordHash),
      allowUMichEmailOnly: true,
      requiredFields: {
        name: Boolean(dbEvent.requireName !== undefined ? dbEvent.requireName : false),
        umichEmail: true, // Always required
        major: Boolean(dbEvent.requireMajor || false),
        gradeLevel: Boolean(dbEvent.requireGradeLevel || false),
        phone: Boolean(dbEvent.requirePhone || false),
      },
      smsReminders: Boolean(dbEvent.requirePhone || false),
    },
    // Exclude MongoDB-specific fields like _id
  };
  
  const userRegistration = await getUserRegistration(dbEvent.id, userEmail);
  
  return (
    <main className="min-h-screen bg-[#00274c]">
      <EventDetailPage 
        event={serializedEvent} 
        userRegistration={userRegistration}
        userEmail={userEmail}
        eventStats={eventStats}
      />
    </main>
  );
}

// Dynamic generation disabled since we're using force-dynamic
// This ensures proper session handling and database queries