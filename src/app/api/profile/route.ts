import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

const uri = process.env.DATABASE_URL!;
const isProduction = process.env.NODE_ENV === 'production';
const hasTlsInConnectionString = /[?&](tls|ssl)=/.test(uri);

const mongoOptions: any = hasTlsInConnectionString
  ? (isProduction 
      ? { tlsCAFile: '/app/global-bundle.pem' }
      : { tlsAllowInvalidCertificates: true })
  : {
      tls: isProduction,
      tlsCAFile: isProduction ? '/app/global-bundle.pem' : undefined,
    };

const client = new MongoClient(uri, mongoOptions);

/**
 * GET /api/profile - Get current user's profile and linked team member info
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await client.connect();
    const db = client.db();
    
    // Get user from database
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get linked team member if exists
    let teamMember = null;
    if (user.teamMemberId) {
      teamMember = await db.collection('TeamMember').findOne({ 
        _id: new ObjectId(user.teamMemberId) 
      });
      if (teamMember) {
        teamMember = {
          ...teamMember,
          id: teamMember._id.toString()
        };
      }
    }

    // Get available projects for PROJECT_TEAM_MEMBER users
    let availableProjects: any[] = [];
    const userRoles = user.roles || [];
    if (userRoles.includes('PROJECT_TEAM_MEMBER')) {
      const projects = await db.collection('Project')
        .find({ published: true })
        .project({ _id: 1, id: 1, title: 1 })
        .toArray();
      availableProjects = projects.map((p: any) => ({
        id: p.id || p._id.toString(),
        title: p.title
      }));
    }

    const profile = {
      user: safeJson(user),
      teamMember: teamMember ? safeJson(teamMember) : null,
      availableProjects
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  } finally {
    await client.close();
  }
}

/**
 * PUT /api/profile - Update current user's profile
 * Users can update their own basic info and linked team member profile
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    await client.connect();
    const db = client.db();
    
    // Get user from database
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user profile (basic info)
    if (data.userProfile) {
      await db.collection('users').updateOne(
        { email: session.user.email },
        { 
          $set: {
            'profile.major': data.userProfile.major?.trim() || null,
            'profile.school': data.userProfile.school?.trim() || null,
            'profile.graduationYear': data.userProfile.graduationYear || null,
            'profile.phone': data.userProfile.phone?.trim() || null,
            updatedAt: new Date()
          }
        }
      );
    }

    // Update linked team member if exists and user is updating it
    if (data.teamMember && user.teamMemberId) {
      const teamMemberId = new ObjectId(user.teamMemberId);
      
      // Users can only update certain fields of their own profile
      const allowedUpdates: any = {
        bio: data.teamMember.bio?.trim() || null,
        linkedIn: data.teamMember.linkedIn?.trim() || null,
        github: data.teamMember.github?.trim() || null,
        imageUrl: data.teamMember.imageUrl?.trim() || null,
        updatedAt: new Date()
      };

      // Allow PROJECT_TEAM_MEMBER users to set their projects
      const userRoles = user.roles || [];
      if (userRoles.includes('PROJECT_TEAM_MEMBER') && data.teamMember.projects !== undefined) {
        const projects = Array.isArray(data.teamMember.projects) 
          ? data.teamMember.projects.filter((p: string) => p?.trim())
          : [];
        allowedUpdates.projects = projects;
      }

      await db.collection('TeamMember').updateOne(
        { _id: teamMemberId },
        { $set: allowedUpdates }
      );
    }

    // Return updated profile
    const updatedUser = await db.collection('users').findOne({ 
      email: session.user.email 
    });

    let teamMember = null;
    if (user.teamMemberId) {
      teamMember = await db.collection('TeamMember').findOne({ 
        _id: new ObjectId(user.teamMemberId) 
      });
      if (teamMember) {
        teamMember = {
          ...teamMember,
          id: teamMember._id.toString()
        };
      }
    }

    return NextResponse.json({
      user: safeJson(updatedUser),
      teamMember: teamMember ? safeJson(teamMember) : null
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  } finally {
    await client.close();
  }
}
