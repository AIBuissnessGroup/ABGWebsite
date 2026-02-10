import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

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
 * POST /api/profile/link - Link user account to team member
 * Admins only
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userEmail, teamMemberId } = await request.json();
    
    if (!userEmail || !teamMemberId) {
      return NextResponse.json({ 
        error: 'Missing required fields: userEmail and teamMemberId' 
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db();
    
    // Verify team member exists
    const teamMember = await db.collection('TeamMember').findOne({ 
      _id: new ObjectId(teamMemberId) 
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Link user to team member
    const result = await db.collection('users').updateOne(
      { email: userEmail },
      { 
        $set: {
          teamMemberId: teamMemberId,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Linked ${userEmail} to team member ${teamMember.name}` 
    });
  } catch (error) {
    console.error('Error linking profile:', error);
    return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 });
  } finally {
    await client.close();
  }
}

/**
 * DELETE /api/profile/link - Unlink user account from team member
 * Admins only
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    
    if (!userEmail) {
      return NextResponse.json({ 
        error: 'Missing required parameter: email' 
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db();
    
    // Unlink user from team member
    const result = await db.collection('users').updateOne(
      { email: userEmail },
      { 
        $unset: { teamMemberId: '' },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Unlinked ${userEmail} from team member` 
    });
  } catch (error) {
    console.error('Error unlinking profile:', error);
    return NextResponse.json({ error: 'Failed to unlink profile' }, { status: 500 });
  } finally {
    await client.close();
  }
}
