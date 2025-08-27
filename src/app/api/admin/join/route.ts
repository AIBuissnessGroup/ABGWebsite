import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoClient, ObjectId } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      return user.email && user.email.endsWith('@umich.edu');
    },
    async session({ session, token }: any) {
      if (session?.user && token) {
        session.user.id = token.sub || '';
        session.user.role = token.role || 'USER';
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.email && isAdminEmail(user.email) ? 'ADMIN' : 'USER';
      }
      return token;
    },
  },
  session: { strategy: 'jwt' as const },
};

// Helper function to log changes (simplified for now)
async function logChange(userId: string, userEmail: string, action: string, resource: string, resourceId?: string, changes?: any) {
  try {
    // For now, just console.log - we'll implement proper audit logging after Prisma is fixed
    console.log('AUDIT LOG:', { userId, userEmail, action, resource, resourceId, changes });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
    // Fetch the latest join content from the database
    const joinContent = await db.collection('joinContent').findOne(
      { isActive: true },
      { sort: { updatedAt: -1 } }
    );

    if (!joinContent) {
      // Return default content if none found
      const defaultContent = {
        id: 'default',
        title: 'Join Us',
        description: 'Content not found in database.',
        isActive: true,
        updatedAt: Date.now()
      };
      return NextResponse.json(safeJson(defaultContent));
    }

    return NextResponse.json(safeJson(joinContent));
  } catch (error) {
    console.error('Error fetching join content:', error);
    return NextResponse.json({ error: 'Failed to fetch join content' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();
    const db = client.db();

    const user = await db.collection('User').findOne({ email: session.user.email });

    if (!user || user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();

    // Update or create join content
    const updatedContent = {
      id: 'default',
      ...data,
      isActive: true,
      updatedAt: new Date()
    };

    await db.collection('joinContent').updateOne(
      { id: 'default' },
      { $set: updatedContent },
      { upsert: true }
    );

    // Log the change
    await logChange(
      user._id.toString(),
      user.email,
      'UPDATE',
      'join',
      'default',
      { updated: data }
    );

    return NextResponse.json(safeJson(updatedContent));
  } catch (error) {
    console.error('Error updating join content:', error);
    return NextResponse.json({ error: 'Failed to update join content' }, { status: 500 });
  } finally {
    await client.close();
  }
} 