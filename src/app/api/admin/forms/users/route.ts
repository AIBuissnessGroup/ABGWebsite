import { getDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin, getAdminEmails } from '@/lib/admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();

    // Fetch admin users with their name and email
    const adminEmails = getAdminEmails();
    const query = {
      email: { $exists: true, $nin: [null, ''] },
      $or: [
        { roles: { $in: ['ADMIN'] } },
        { role: 'ADMIN' },
        ...(adminEmails.length > 0 ? [{ email: { $in: adminEmails } }] : [])
      ]
    };

    const users = await db.collection('users')
      .find(query, { projection: { email: 1, name: 1, roles: 1, _id: 0 } })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
