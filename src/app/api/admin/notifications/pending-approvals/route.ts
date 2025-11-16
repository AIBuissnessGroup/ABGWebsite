import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db('abg-website');
    
    // Fetch pending approvals for this user
    const approvals = await db.collection('pendingApprovals')
      .find({
        $or: [
          { requesterEmail: session.user.email },
          { approverEmail: session.user.email }
        ],
        status: 'pending'
      })
      .sort({ createdAt: -1 })
      .toArray();

    await client.close();

    return NextResponse.json({ 
      success: true,
      approvals: approvals.map(a => ({
        id: a._id.toString(),
        subject: a.subject,
        approverEmail: a.approverEmail,
        approverName: a.approverName,
        requesterEmail: a.requesterEmail,
        requesterName: a.requesterName,
        recipients: a.recipients,
        actionType: a.actionType,
        createdAt: a.createdAt,
        status: a.status
      }))
    });

  } catch (error) {
    console.error('Failed to fetch pending approvals:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch pending approvals' 
    }, { status: 500 });
  }
}
