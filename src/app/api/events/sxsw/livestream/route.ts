import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

import { SXSWLivestreamConfig } from '@/types/events';


// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

// GET - Fetch livestream status
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

    const sxswData = await db.collection('SXSWEvent').findOne({ id: 'sxsw-2026' });

    const livestream: SXSWLivestreamConfig = sxswData?.livestream || {
      enabled: false,
      status: 'upcoming',
      hlsUrl: '',
      title: 'SXSW 2026 Livestream',
      description: 'Watch live from Hail to the Innovators at SXSW 2026.',
    };

    return corsResponse(NextResponse.json({ livestream }));
  } catch (error) {
    console.error('Error fetching livestream status:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch livestream status' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}

// PATCH - Update livestream status (admin only)
export async function PATCH(request: NextRequest) {
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

    // Build update object for livestream fields only
    const updateFields: Partial<SXSWLivestreamConfig> = {};
    
    if (typeof body.enabled === 'boolean') {
      updateFields.enabled = body.enabled;
    }
    if (body.status && ['upcoming', 'live', 'ended'].includes(body.status)) {
      updateFields.status = body.status;
      // Set startTime when going live
      if (body.status === 'live') {
        updateFields.startTime = Date.now();
      }
    }
    if (typeof body.hlsUrl === 'string') {
      updateFields.hlsUrl = body.hlsUrl;
    }
    if (typeof body.title === 'string') {
      updateFields.title = body.title;
    }
    if (typeof body.description === 'string') {
      updateFields.description = body.description;
    }

    // Update livestream fields
    const updateObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      updateObj[`livestream.${key}`] = value;
    }
    updateObj.updatedAt = Date.now();

    await db.collection('SXSWEvent').updateOne(
      { id: 'sxsw-2026' },
      { $set: updateObj },
      { upsert: true }
    );

    // Fetch and return updated livestream config
    const updatedData = await db.collection('SXSWEvent').findOne({ id: 'sxsw-2026' });

    return corsResponse(NextResponse.json({ 
      success: true, 
      livestream: updatedData?.livestream 
    }));
  } catch (error) {
    console.error('Error updating livestream status:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to update livestream status' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}
