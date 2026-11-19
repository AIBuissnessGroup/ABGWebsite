import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { uploadToGridFS } from '@/lib/gridfs';

const APPROVER_NAMES: Record<string, string> = {
  president: 'Current President',
  operations: 'VP Operations',
  finance: 'VP Finance',
};

function rolePattern(role: string) {
  if (role === 'president') return /president/i;
  if (role === 'operations') return /operations/i;
  return /finance/i;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Please sign in before submitting a reimbursement request.' }, { status: 401 });
    }
    const requesterUserId = session.user.id?.trim();
    const requesterEmail = session.user.email?.trim();
    const requesterIdentity = requesterUserId || requesterEmail;
    if (!requesterIdentity) {
      return NextResponse.json({ error: 'Your sign-in session is missing an account identifier. Please sign in again.' }, { status: 401 });
    }

    const formData = await request.formData();
    const requesterName = String(formData.get('requesterName') || '').trim();
    const requesterContact = String(formData.get('requesterContact') || '').trim();
    const approverRole = String(formData.get('approverRole') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const amount = Number(formData.get('amount'));
    const receipt = formData.get('receipt');

    if (!requesterName || !requesterContact || !description) {
      return NextResponse.json({ error: 'Name, contact, and purchase description are required.' }, { status: 400 });
    }
    if (!['president', 'operations', 'finance'].includes(approverRole)) {
      return NextResponse.json({ error: 'Please select a valid approver.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0.01 || amount > 100000) {
      return NextResponse.json({ error: 'Enter a valid reimbursement amount.' }, { status: 400 });
    }
    if (!(receipt instanceof File)) {
      return NextResponse.json({ error: 'A receipt image is required.' }, { status: 400 });
    }
    if (!receipt.type.startsWith('image/')) {
      return NextResponse.json({ error: 'The receipt must be an image file.' }, { status: 400 });
    }
    if (receipt.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'The receipt image must be 10 MB or smaller.' }, { status: 400 });
    }

    const db = await getDb();
    const teamMember = await db.collection('TeamMember').findOne({
      active: true,
      role: rolePattern(approverRole),
    });

    const now = new Date();
    const buffer = Buffer.from(await receipt.arrayBuffer());
    const fileId = await uploadToGridFS(
      receipt.name || 'receipt',
      buffer,
      'reimbursement_receipts',
      {
        contentType: receipt.type,
        originalName: receipt.name,
        size: receipt.size,
      }
    );

    const document = {
      requesterUserId: requesterUserId || '',
      requesterEmail: requesterEmail || null,
      requesterName,
      requesterContact,
      approverRole,
      approverTeamMemberId: teamMember?._id?.toString(),
      approverName: teamMember?.name || APPROVER_NAMES[approverRole],
      description,
      amountCents: Math.round(amount * 100),
      currency: 'USD',
      receipt: {
        fileId,
        originalName: receipt.name,
        contentType: receipt.type,
        size: receipt.size,
      },
      status: 'REQUESTED',
      statusHistory: [{
        status: 'REQUESTED',
        changedByUserId: requesterIdentity,
        changedAt: now,
      }],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('ReimbursementRequest').insertOne(document);
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[reimbursements] Failed to create request:', error);
    return NextResponse.json({ error: 'Unable to submit reimbursement request.' }, { status: 500 });
  }
}
