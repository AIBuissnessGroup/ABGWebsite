import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getUserMeetingAttendance } from '@/lib/meetings';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const db = await getDb();
    const usersCollection = db.collection('users');

    let user: any = null;
    if (ObjectId.isValid(userId)) {
      user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    }
    if (!user) {
      user = await usersCollection.findOne({ email: userId.toLowerCase().trim() });
    }

    const identifier = user ? user._id.toString() : userId;
    const userEmail = user?.email || userId;
    
    // Also try by email if userId didn't match records
    let meetings = await getUserMeetingAttendance(identifier);
    if (meetings.length === 0 && userEmail !== identifier) {
      meetings = await getUserMeetingAttendance(userEmail);
    }

    return NextResponse.json({
      user: user
        ? {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            roles: user.roles || ['USER'],
          }
        : {
            id: userId,
            name: 'User',
            email: userId,
            roles: [],
          },
      meetings,
      totalAttended: meetings.length,
    });
  } catch (error) {
    console.error('Error fetching user meeting attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch user attendance' }, { status: 500 });
  }
}
