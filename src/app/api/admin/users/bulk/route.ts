import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin, validateRoles, USER_ROLES } from '@/lib/roles';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import type { UserRole } from '@/types/next-auth';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

function createMongoClient() {
  return new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });
}

// POST - Bulk update user roles (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds, action, role } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs required' }, { status: 400 });
    }

    if (!action || !['addRole', 'removeRole'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!role || !USER_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const client = createMongoClient();
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Get all target users
    const objectIds = userIds.map(id => new ObjectId(id));
    const targetUsers = await usersCollection.find({ _id: { $in: objectIds } }).toArray();

    if (targetUsers.length === 0) {
      await client.close();
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (const user of targetUsers) {
      try {
        const currentRoles = user.roles || ['USER'];
        let newRoles: UserRole[];

        if (action === 'addRole') {
          if (currentRoles.includes(role)) {
            continue; // Already has role
          }
          newRoles = [...currentRoles, role as UserRole];
        } else {
          if (!currentRoles.includes(role)) {
            continue; // Doesn't have role
          }
          newRoles = currentRoles.filter((r: string) => r !== role);
          // Ensure at least USER role
          if (newRoles.length === 0) {
            newRoles = ['USER'];
          }
        }

        // Safety: don't remove ADMIN from last admin
        if (action === 'removeRole' && role === 'ADMIN') {
          const adminCount = await usersCollection.countDocuments({ roles: 'ADMIN' });
          if (adminCount <= 1 && currentRoles.includes('ADMIN')) {
            errors.push(`Cannot remove ADMIN from ${user.email} - last admin`);
            continue;
          }
        }

        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              roles: newRoles,
              updatedAt: new Date()
            }
          }
        );

        updatedCount++;
      } catch (err) {
        errors.push(`Failed to update ${user.email}`);
      }
    }

    await client.close();

    // Log this bulk action
    const { ip, userAgent } = getRequestMetadata(request);
    await logAuditEvent(
      session.user.id || 'unknown',
      session.user.email,
      'user.role_changed',
      'User',
      {
        meta: {
          action,
          role,
          targetCount: userIds.length,
          updatedCount,
          errors: errors.length > 0 ? errors : undefined
        },
        ip,
        userAgent
      }
    );

    return NextResponse.json({ 
      success: true,
      message: `Updated ${updatedCount} of ${userIds.length} users`,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in bulk user update:', error);
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 });
  }
}
