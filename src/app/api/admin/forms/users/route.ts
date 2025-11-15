import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Fetch only admin users with their name and email
    console.log('Fetching users with ADMIN role...');
    
    const users = await db.collection('users') // Changed from 'User' to 'users'
      .find(
        { 
          email: { 
            $exists: true, 
            $nin: [null, ''] 
          },
          roles: { $in: ['ADMIN'] } // Check if 'ADMIN' is in the roles array
        },
        { projection: { email: 1, name: 1, roles: 1, _id: 0 } }
      )
      .sort({ name: 1 })
      .toArray();

    console.log(`Found ${users.length} admin users:`, users);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
