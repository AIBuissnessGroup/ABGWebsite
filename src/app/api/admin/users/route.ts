import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin, validateRoles, wouldRemoveLastAdmin, USER_ROLES } from '@/lib/roles';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import type { UserRole } from '@/types/next-auth';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

function createMongoClient() {
  return new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });
}

// Safely serialize MongoDB objects
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// GET - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const client = createMongoClient();
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Build search filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (roleFilter && USER_ROLES.includes(roleFilter as UserRole)) {
      filter.roles = roleFilter;
    }

    // Get users with pagination
    const users = await usersCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await usersCollection.countDocuments(filter);

    // Migrate users from old role system if needed
    const usersToUpdate = users.filter(user => user.role && !user.roles);
    if (usersToUpdate.length > 0) {
      for (const user of usersToUpdate) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              roles: [user.role],
              updatedAt: new Date()
            },
            $unset: { role: "" }
          }
        );
        // Update the user object for the response
        user.roles = [user.role];
        delete user.role;
      }
    }

    await client.close();

    // Format user data for response
    const formattedUsers = users.map(user => ({
      id: user._id?.toString(),
      email: user.email,
      name: user.name || '',
      roles: user.roles || ['USER'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile || {},
      teamMemberId: user.teamMemberId?.toString() || null
    }));

    return NextResponse.json({
      users: safeJson(formattedUsers),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      },
      availableRoles: USER_ROLES
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH - Update user roles (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, roles: newRoles } = await request.json();

    if (!userId || !Array.isArray(newRoles)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Validate roles
    const validatedRoles = validateRoles(newRoles);
    if (validatedRoles.length !== newRoles.length) {
      return NextResponse.json({ error: 'Invalid roles provided' }, { status: 400 });
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

    // Safety check: prevent removing the last admin
    if (await wouldRemoveLastAdmin(targetUser.email, validatedRoles, db)) {
      await client.close();
      return NextResponse.json({ 
        error: 'Cannot remove admin role from the last remaining administrator' 
      }, { status: 400 });
    }

    // Update user roles
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          roles: validatedRoles,
          updatedAt: new Date()
        }
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log this change to audit log
    const { ip, userAgent } = getRequestMetadata(request);
    
    await logAuditEvent(
      session.user.id || 'unknown',
      session.user.email,
      'user.role_changed',
      'User',
      {
        targetId: userId,
        meta: {
          targetUserEmail: targetUser.email,
          oldRoles: targetUser.roles || [targetUser.role || 'USER'],
          newRoles: validatedRoles
        },
        ip,
        userAgent
      }
    );

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated roles for ${targetUser.email}` 
    });

  } catch (error) {
    console.error('Error updating user roles:', error);
    return NextResponse.json({ error: 'Failed to update user roles' }, { status: 500 });
  }
}