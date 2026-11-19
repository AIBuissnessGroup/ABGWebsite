import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { canAccessAdminPage } from '@/lib/permissions';
import { getDb } from '@/lib/mongodb';
import { getGridFSBucket, nodeToWebStream } from '@/lib/gridfs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles || !canAccessAdminPage(session.user.roles, 'reimbursements')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  if (!ObjectId.isValid(params.id)) {
    return new NextResponse('Invalid request ID', { status: 400 });
  }

  try {
    const db = await getDb();
    const reimbursement = await db.collection('ReimbursementRequest').findOne({
      _id: new ObjectId(params.id),
    });
    if (!reimbursement?.receipt?.fileId) {
      return new NextResponse('Receipt not found', { status: 404 });
    }

    const bucket = await getGridFSBucket('reimbursement_receipts');
    const fileId = new ObjectId(reimbursement.receipt.fileId);
    const stream = bucket.openDownloadStream(fileId);
    return new Response(nodeToWebStream(stream), {
      headers: {
        'Content-Type': reimbursement.receipt.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${reimbursement.receipt.originalName || 'receipt'}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[reimbursements] Failed to retrieve receipt:', error);
    return new NextResponse('Failed to retrieve receipt', { status: 500 });
  }
}
