import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { canAccessAdminPage } from '@/lib/permissions';
import { getDb } from '@/lib/mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles || !canAccessAdminPage(session.user.roles, 'reimbursements')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid request ID.' }, { status: 400 });
    }
    const body = await request.json();
    if (body.status !== 'Paid' && body.status !== 'Requested') {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }

    const status = body.status === 'Paid' ? 'PAID' : 'REQUESTED';
    const now = new Date();
    const db = await getDb();
    const result = await db.collection('ReimbursementRequest').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: { status, updatedAt: now },
        $push: {
          statusHistory: {
            status,
            changedByUserId: session.user.id || session.user.email || '',
            changedAt: now,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Reimbursement request not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, status: body.status });
  } catch (error) {
    console.error('[admin reimbursements] Failed to update status:', error);
    return NextResponse.json({ error: 'Failed to update reimbursement status.' }, { status: 500 });
  }
}
