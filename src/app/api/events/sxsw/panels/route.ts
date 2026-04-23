import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

import { SXSWPanel } from '@/types/events';


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

// Generate unique ID
function generateId(): string {
  return `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// GET - Fetch all SXSW panels
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

    const panels = await db.collection('SXSWPanel')
      .find({})
      .sort({ order: 1, startTime: 1 })
      .toArray();

    return corsResponse(NextResponse.json({ panels }));
  } catch (error) {
    console.error('Error fetching SXSW panels:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}

// POST - Create new SXSW panel
export async function POST(request: NextRequest) {
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

    // Get current highest order
    const lastPanel = await db.collection('SXSWPanel').findOne({}, { sort: { order: -1 } });
    const nextOrder = lastPanel?.order ? lastPanel.order + 1 : 0;

    const panel: SXSWPanel = {
      id: generateId(),
      title: body.title || 'New Panel',
      description: body.description || '',
      startTime: body.startTime || Date.now(),
      endTime: body.endTime || Date.now() + 3600000, // 1 hour default
      location: body.location || '',
      speakers: body.speakers || [],
      type: body.type || 'panel',
      order: body.order ?? nextOrder,
    };

    await db.collection('SXSWPanel').insertOne(panel);

    return corsResponse(NextResponse.json({ success: true, panel }));
  } catch (error) {
    console.error('Error creating SXSW panel:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to create panel' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}

// PUT - Update SXSW panel
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) {
      return corsResponse(NextResponse.json({ error: 'Database connection not configured' }, { status: 500 }));
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return corsResponse(NextResponse.json({ error: 'Panel ID is required' }, { status: 400 }));
    }
    
    client = new MongoClient(uri, {
      tls: true,
    });
    
    const db = await getDb();

    const result = await db.collection('SXSWPanel').updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return corsResponse(NextResponse.json({ error: 'Panel not found' }, { status: 404 }));
    }

    return corsResponse(NextResponse.json({ success: true, message: 'Panel updated' }));
  } catch (error) {
    console.error('Error updating SXSW panel:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to update panel' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}

// DELETE - Delete SXSW panel
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) {
      return corsResponse(NextResponse.json({ error: 'Database connection not configured' }, { status: 500 }));
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return corsResponse(NextResponse.json({ error: 'Panel ID is required' }, { status: 400 }));
    }
    
    client = new MongoClient(uri, {
      tls: true,
    });
    
    const db = await getDb();

    const result = await db.collection('SXSWPanel').deleteOne({ id });

    if (result.deletedCount === 0) {
      return corsResponse(NextResponse.json({ error: 'Panel not found' }, { status: 404 }));
    }

    return corsResponse(NextResponse.json({ success: true, message: 'Panel deleted' }));
  } catch (error) {
    console.error('Error deleting SXSW panel:', error);
    return corsResponse(NextResponse.json({ error: 'Failed to delete panel' }, { status: 500 }));
  } finally {
    if (client) {
      
    }
  }
}
