/**
 * Debug endpoint to check user data in database
 * DELETE THIS FILE AFTER DEBUGGING
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { withConnection } from '@/lib/recruitment/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId') || '6967171995a1750a0e6a12b7';

    const data = await withConnection(async (db) => {
      // Get a sample of applications
      const applications = await db.collection('recruitment_applications')
        .find({ cycleId })
        .limit(10)
        .toArray();
      
      // Get sample users
      const users = await db.collection('users')
        .find({})
        .limit(20)
        .toArray();
      
      return {
        currentUser: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        applications: applications.map(a => ({
          _id: a._id.toString(),
          userId: a.userId,
          userEmail: a.userEmail,
          userName: a.userName,
          track: a.track,
          stage: a.stage,
        })),
        users: users.map(u => ({
          _id: u._id.toString(),
          email: u.email,
          name: u.name,
          googleId: u.googleId,
        })),
      };
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST to manually update applications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Update current user's googleId in users collection
    if (body.action === 'update_my_googleid') {
      const result = await withConnection(async (db) => {
        await db.collection('users').updateOne(
          { email: session.user.email },
          { $set: { googleId: session.user.id } }
        );
        return { updated: true, email: session.user.email, googleId: session.user.id };
      });
      return NextResponse.json(result);
    }
    
    // Update a specific application's answers with name and email
    if (body.action === 'update_application' && body.appId && body.email) {
      const { ObjectId } = await import('mongodb');
      const result = await withConnection(async (db) => {
        // Update answers.name and answers.email
        await db.collection('recruitment_applications').updateOne(
          { _id: new ObjectId(body.appId) },
          { 
            $set: { 
              'answers.name': body.name || body.email.split('@')[0],
              'answers.email': body.email,
              userEmail: body.email,
              userName: body.name || body.email.split('@')[0]
            }
          }
        );
        return { updated: true, appId: body.appId, email: body.email, name: body.name };
      });
      return NextResponse.json(result);
    }
    
    // Bulk update all applications in a cycle with test data
    if (body.action === 'bulk_update_test' && body.cycleId) {
      const result = await withConnection(async (db) => {
        const apps = await db.collection('recruitment_applications')
          .find({ cycleId: body.cycleId })
          .toArray();
        
        let updated = 0;
        for (const app of apps) {
          // Generate test data if no email in answers
          if (!app.answers?.email) {
            const testEmail = `test${updated + 1}@umich.edu`;
            const testName = `Test User ${updated + 1}`;
            await db.collection('recruitment_applications').updateOne(
              { _id: app._id },
              { 
                $set: { 
                  'answers.name': testName,
                  'answers.email': testEmail,
                  userEmail: testEmail,
                  userName: testName
                }
              }
            );
            updated++;
          }
        }
        return { updated, total: apps.length };
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Debug POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
