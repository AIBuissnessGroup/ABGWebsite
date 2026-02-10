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
 * GET /api/profile/projects - Get projects where user is a team member
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
    let teamMemberId = null;
    if (user.teamMemberId) {
      teamMemberId = user.teamMemberId.toString();
    }

    // Get all projects where user is a team member
    const projects = await db.collection('Project')
      .find({ 
        published: true,
        'teamMembers.memberId': teamMemberId
      })
      .toArray();

    // Map projects and include user's contribution info
    const projectsWithContributions = projects.map(project => {
      const userContribution = project.teamMembers?.find(
        (tm: any) => tm.memberId === teamMemberId
      );
      
      return {
        ...safeJson(project),
        id: project._id.toString(),
        userContribution: userContribution || null
      };
    });

    return NextResponse.json(projectsWithContributions);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  } finally {
    await client.close();
  }
}

/**
 * PUT /api/profile/projects - Update user's contribution to a project
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId, contribution } = await request.json();
    
    if (!projectId || !contribution) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId and contribution' 
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db();
    
    // Get user from database
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });

    if (!user || !user.teamMemberId) {
      return NextResponse.json({ 
        error: 'User not linked to team member' 
      }, { status: 400 });
    }

    const teamMemberId = user.teamMemberId.toString();

    // Update the user's contribution in the project
    const result = await db.collection('Project').updateOne(
      { 
        _id: new ObjectId(projectId),
        'teamMembers.memberId': teamMemberId
      },
      { 
        $set: {
          'teamMembers.$.contribution': contribution.trim(),
          'teamMembers.$.updatedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Project not found or you are not a team member' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contribution updated successfully' 
    });
  } catch (error) {
    console.error('Error updating project contribution:', error);
    return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 });
  } finally {
    await client.close();
  }
}
