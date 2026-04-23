import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { hasRole } from '@/lib/roles';



export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SPECIAL_PRIVS can access permissions
    if (!hasRole(session.user.roles, 'SPECIAL_PRIVS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    
    const db = await getDb();

    // Load permissions from database
    const config = await db.collection('Config').findOne({ key: 'rolePermissions' });
    
    return NextResponse.json({
      permissions: config?.value || {}
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SPECIAL_PRIVS can modify permissions
    if (!hasRole(session.user.roles, 'SPECIAL_PRIVS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { permissions } = await request.json();

    
    const db = await getDb();

    // Save permissions to database
    await db.collection('Config').updateOne(
      { key: 'rolePermissions' },
      { 
        $set: { 
          value: permissions,
          updatedAt: new Date(),
          updatedBy: session.user.email
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
}
