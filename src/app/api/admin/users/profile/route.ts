import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

function createMongoClient() {
  return new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });
}

// PATCH - Update user profile and team member link (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, name, teamMemberId, profile } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const client = createMongoClient();
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Get the target user
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      await client.close();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (teamMemberId !== undefined) {
      updateData.teamMemberId = teamMemberId ? new ObjectId(teamMemberId) : null;
    }

    if (profile) {
      if (profile.major !== undefined) updateData['profile.major'] = profile.major;
      if (profile.school !== undefined) updateData['profile.school'] = profile.school;
      if (profile.graduationYear !== undefined) updateData['profile.graduationYear'] = profile.graduationYear;
      if (profile.phone !== undefined) updateData['profile.phone'] = profile.phone;
    }

    // Update user
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    await client.close();

    // Log this change
    const { ip, userAgent } = getRequestMetadata(request);
    await logAuditEvent(
      session.user.id || 'unknown',
      session.user.email,
      'content.updated',
      'User',
      {
        targetId: userId,
        meta: {
          targetUserEmail: targetUser.email,
          changes: Object.keys(updateData).filter(k => k !== 'updatedAt')
        },
        ip,
        userAgent
      }
    );

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated profile for ${targetUser.email}` 
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
