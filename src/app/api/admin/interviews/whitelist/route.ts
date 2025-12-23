import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

// GET /api/admin/interviews/whitelist - Get approved emails
export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    await client.connect();
    const db = client.db();

    const whitelistEntries = await db.collection('InterviewWhitelist').find({}).sort({ createdAt: -1 }).toArray();

    const transformedEntries = whitelistEntries.map((entry: any) => ({
      id: entry.id || entry._id.toString(),
      email: entry.email,
      addedBy: entry.addedBy,
      createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
    }));

    return NextResponse.json(transformedEntries);
  } catch (error) {
    console.error('Error fetching interview whitelist:', error);
    return NextResponse.json({ error: 'Failed to fetch whitelist' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// POST /api/admin/interviews/whitelist - Add email to whitelist
export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate it's a umich.edu email
    if (!cleanEmail.endsWith('@umich.edu')) {
      return NextResponse.json({ error: 'Only @umich.edu emails are allowed' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Check if email already exists
    const existingEntry = await db.collection('InterviewWhitelist').findOne({ email: cleanEmail });
    if (existingEntry) {
      return NextResponse.json({ error: 'Email already in whitelist' }, { status: 400 });
    }

    // Add to whitelist
    const whitelistEntry = {
      id: `whitelist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: cleanEmail,
      addedBy: session.user.email,
      createdAt: new Date(),
    };

    await db.collection('InterviewWhitelist').insertOne(whitelistEntry);

    return NextResponse.json({
      success: true,
      message: 'Email added to interview whitelist',
      entry: {
        id: whitelistEntry.id,
        email: whitelistEntry.email,
        addedBy: whitelistEntry.addedBy,
        createdAt: whitelistEntry.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error adding to interview whitelist:', error);
    return NextResponse.json({ error: 'Failed to add email to whitelist' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// DELETE /api/admin/interviews/whitelist - Remove email from whitelist
export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const entryId = searchParams.get('id');

    if (!email && !entryId) {
      return NextResponse.json({ error: 'Email or entry ID is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    let result;
    if (entryId) {
      if (ObjectId.isValid(entryId)) {
        result = await db.collection('InterviewWhitelist').deleteOne({ _id: new ObjectId(entryId) });
      } else {
        result = await db.collection('InterviewWhitelist').deleteOne({ id: entryId });
      }
    } else if (email) {
      result = await db.collection('InterviewWhitelist').deleteOne({ email: email.toLowerCase() });
    } else {
      return NextResponse.json({ error: 'Email or entry ID is required' }, { status: 400 });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Email not found in whitelist' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email removed from interview whitelist'
    });

  } catch (error) {
    console.error('Error removing from interview whitelist:', error);
    return NextResponse.json({ error: 'Failed to remove email from whitelist' }, { status: 500 });
  } finally {
    await client.close();
  }
}
