import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient } from 'mongodb';

// Configure route to handle large payloads
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

async function getDb() {
  await client.connect();
  return client.db('abg-website');
}

// GET - Retrieve all drafts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const drafts = await db.collection('emailDrafts')
      .find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// POST - Create a new draft
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, emailTitle, contentSections, selectedUsers, selectedMcommunityGroups, bannerSettings, bottomBannerSettings } = body;

    const db = await getDb();
    const draft = {
      userId: session.user.id,
      name,
      subject,
      emailTitle,
      contentSections,
      selectedUsers: selectedUsers || [],
      selectedMcommunityGroups: selectedMcommunityGroups || [],
      bannerSettings: bannerSettings || {},
      bottomBannerSettings: bottomBannerSettings || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('emailDrafts').insertOne(draft);
    
    return NextResponse.json({ draft: { ...draft, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}

// PUT - Update an existing draft
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, subject, emailTitle, contentSections, selectedUsers, selectedMcommunityGroups, bannerSettings, bottomBannerSettings } = await request.json();
    const db = await getDb();
    const { ObjectId } = require('mongodb');
    
    const result = await db.collection('emailDrafts').updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      {
        $set: {
          name,
          subject,
          emailTitle,
          contentSections,
          selectedUsers: selectedUsers || [],
          selectedMcommunityGroups: selectedMcommunityGroups || [],
          bannerSettings: bannerSettings || {},
          bottomBannerSettings: bottomBannerSettings || {},
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

// DELETE - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    const db = await getDb();
    const { ObjectId } = require('mongodb');
    
    const result = await db.collection('emailDrafts').deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}
