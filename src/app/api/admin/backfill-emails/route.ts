/**
 * Admin API to backfill userEmail on applications
 * POST - Updates all applications missing userEmail
 * Requires body: { mappings: [{ appId: string, email: string, name?: string }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { withConnection } from '@/lib/recruitment/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // If mappings are provided, use them
    if (body.mappings && Array.isArray(body.mappings)) {
      const results = await withConnection(async (db) => {
        const applicationsCollection = db.collection('recruitment_applications');
        let updated = 0;
        
        for (const mapping of body.mappings) {
          if (mapping.appId && mapping.email) {
            await applicationsCollection.updateOne(
              { _id: new ObjectId(mapping.appId) },
              { 
                $set: { 
                  userEmail: mapping.email,
                  userName: mapping.name || mapping.email.split('@')[0]
                }
              }
            );
            updated++;
          }
        }
        
        return { updated };
      });
      
      return NextResponse.json({ success: true, ...results });
    }

    // Otherwise, try to auto-match using googleId
    const results = await withConnection(async (db) => {
      const applicationsCollection = db.collection('recruitment_applications');
      const usersCollection = db.collection('users');
      
      // Get all applications without userEmail
      const applications = await applicationsCollection
        .find({ userEmail: { $exists: false } })
        .toArray();
      
      console.log(`Found ${applications.length} applications without userEmail`);
      
      let updated = 0;
      let notFound = 0;
      const details: any[] = [];
      
      for (const app of applications) {
        // Try to find user by googleId
        let user = await usersCollection.findOne({ googleId: app.userId });
        
        // If not found by googleId, try matching session ID to user
        // The userId might be the user's session ID or the email
        if (!user && app.userId?.includes('@')) {
          user = await usersCollection.findOne({ email: app.userId });
        }
        
        if (user) {
          await applicationsCollection.updateOne(
            { _id: app._id },
            { 
              $set: { 
                userEmail: user.email,
                userName: user.name || user.email.split('@')[0]
              }
            }
          );
          updated++;
          details.push({ 
            appId: app._id.toString(), 
            userId: app.userId,
            email: user.email,
            name: user.name,
            status: 'updated'
          });
        } else {
          notFound++;
          details.push({ 
            appId: app._id.toString(), 
            userId: app.userId,
            status: 'user_not_found'
          });
        }
      }
      
      return { 
        total: applications.length, 
        updated, 
        notFound,
        details
      };
    });

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${results.updated} applications, ${results.notFound} users not found`,
      ...results
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check status
    const status = await withConnection(async (db) => {
      const total = await db.collection('recruitment_applications').countDocuments();
      const withEmail = await db.collection('recruitment_applications').countDocuments({ 
        userEmail: { $exists: true, $ne: null } 
      });
      const withoutEmail = await db.collection('recruitment_applications').countDocuments({ 
        userEmail: { $exists: false } 
      });
      
      const usersWithGoogleId = await db.collection('users').countDocuments({
        googleId: { $exists: true, $ne: null }
      });
      const totalUsers = await db.collection('users').countDocuments();
      
      return {
        applications: { total, withEmail, withoutEmail },
        users: { total: totalUsers, withGoogleId: usersWithGoogleId }
      };
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
