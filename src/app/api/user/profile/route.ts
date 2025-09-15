import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || '';

export async function GET(request: NextRequest) {
  try {
    if (!uri) {
      console.error('Database URI not configured');
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    const user = await db.collection('users').findOne({ email: session.user.email });
    
    await client.close();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      profile: user.profile || {
        major: null,
        school: null,
        graduationYear: null,
        phone: null
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!uri) {
      console.error('Database URI not configured');
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { major, school, graduationYear, phone } = await request.json();

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { email: session.user.email },
      {
        $set: {
          'profile.major': major,
          'profile.school': school,
          'profile.graduationYear': graduationYear,
          'profile.phone': phone,
          updatedAt: new Date()
        }
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}