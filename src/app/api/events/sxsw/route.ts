import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

import { SXSWEventData } from '@/types/events';


// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

// Default SXSW event data for initialization
const DEFAULT_SXSW_DATA: SXSWEventData = {
  id: 'sxsw-2026',
  title: 'Hail to the Innovators',
  subtitle: 'University of Michigan @ SXSW 2026',
  description: 'Hail to the Innovators is the University of Michigan\'s flagship presence at SXSW; bringing together founders, innovators, creatives, students, and industry leaders for a day of conversation, discovery, and connection.',
  eventDate: new Date('2026-03-13T09:30:00-05:00').getTime(), // 9:30 AM CDT - Preshow begins
  endDate: new Date('2026-03-13T17:00:00-05:00').getTime(), // 5:00 PM CDT
  location: '716 Congress Ave., Austin, Texas',
  venue: '716 Congress Ave.',
  livestream: {
    enabled: false,
    status: 'upcoming',
    hlsUrl: '',
    title: 'SXSW 2026 Livestream',
    description: 'Watch live panels, demos, and networking from Hail to the Innovators at SXSW 2026.',
  },
  panels: [],
  aboutEvent: `Hail to the Innovators is the University of Michigan's flagship presence at SXSW; bringing together founders, innovators, creatives, students, and industry leaders for a day of conversation, discovery, and connection.

What to Expect:
• Panels on AI, Entrepreneurship, and Leadership
• Live demos and innovation showcases
• Authentic networking between founders, industry leaders, Michigan Alumni, and students
• Collaboration between the University of Texas and University of Michigan
• Experiential activations
• Art and design experiences

Who Should Attend:
• Corporate innovation and strategy leaders
• University partners and Michigan Alumni
• Startup founders and VCs
• Students exploring the future of business and technology
• Creatives, designers, and technologists

Michigan is one of the world's leading institutions at the intersection of technology, business, engineering, and impact. At SXSW, we are bringing that ecosystem to Austin as an interactive innovation hub.`,
  aboutLivestream: 'Join us virtually as we livestream panels, keynotes, and special moments from Hail to the Innovators at SXSW 2026. Watch live from anywhere in the world.',
  registrationUrl: '',
  waitlistUrl: '',
  isEventFull: true,
  updatedAt: Date.now(),
  createdAt: Date.now(),
};

// GET - Fetch SXSW event data
export async function GET() {
  let client: MongoClient | null = null;
  
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) {
      return corsResponse(NextResponse.json({ error: 'Database connection not configured' }, { status: 500 }));
    }

    client = new MongoClient(uri, {
      tls: true,
    });
    
    const db = await getDb();

    // Get SXSW event data
    let sxswData: any = await db.collection('SXSWEvent').findOne({ id: 'sxsw-2026' });

    // If no data exists, create default
    if (!sxswData) {
      await db.collection('SXSWEvent').insertOne(DEFAULT_SXSW_DATA as any);
      sxswData = DEFAULT_SXSW_DATA;
    }

    // Get panels sorted by start time
    const panels = await db.collection('SXSWPanel')
      .find({})
      .sort({ order: 1, startTime: 1 })
      .toArray();

    const response = {
      ...sxswData,
      panels: panels.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        startTime: p.startTime,
        endTime: p.endTime,
        location: p.location,
        speakers: p.speakers || [],
        type: p.type || 'panel',
        order: p.order || 0,
      })),
    };

    return corsResponse(NextResponse.json(response));
  } catch (error) {
    console.error('Error fetching SXSW data:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch SXSW data' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}

// PUT - Update SXSW event data (admin only)
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) {
      return corsResponse(NextResponse.json({ error: 'Database connection not configured' }, { status: 500 }));
    }

    const body = await request.json();
    
    client = new MongoClient(uri, {
      tls: true,
    });
    
    const db = await getDb();

    // Update SXSW event data (excluding panels which are managed separately)
    const updateData = {
      ...body,
      id: 'sxsw-2026', // Ensure ID is always correct
      updatedAt: Date.now(),
    };
    delete updateData.panels; // Panels are managed via separate endpoint

    await db.collection('SXSWEvent').updateOne(
      { id: 'sxsw-2026' },
      { $set: updateData },
      { upsert: true }
    );

    return corsResponse(NextResponse.json({ success: true, message: 'SXSW event updated' }));
  } catch (error) {
    console.error('Error updating SXSW data:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to update SXSW data' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}
