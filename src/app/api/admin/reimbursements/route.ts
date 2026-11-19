import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdminPage } from '@/lib/permissions';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles || !canAccessAdminPage(session.user.roles, 'reimbursements')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const query: Record<string, unknown> = {};

    if (status === 'REQUESTED' || status === 'PAID') query.status = status;
    if (search) {
      query.$or = [
        { requesterName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const db = await getDb();
    const requests = await db.collection('ReimbursementRequest')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      requests: requests.map((item) => ({
        id: item._id.toString(),
        requesterName: item.requesterName,
        contact: item.requesterContact,
        approachedPerson: item.approverName,
        description: item.description,
        amount: item.amountCents / 100,
        submittedAt: item.createdAt,
        status: item.status === 'PAID' ? 'Paid' : 'Requested',
        receiptFileName: item.receipt.originalName,
        receiptFileId: item.receipt.fileId,
      })),
    });
  } catch (error) {
    console.error('[admin reimbursements] Failed to load requests:', error);
    return NextResponse.json({ error: 'Failed to load reimbursement requests.' }, { status: 500 });
  }
}
