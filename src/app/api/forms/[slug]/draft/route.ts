import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Load user's draft for this form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { slug }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find existing draft
    const draft = await prisma.formDraft.findUnique({
      where: {
        formId_userId: {
          formId: form.id,
          userId: user.id
        }
      }
    });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({
      draft: {
        applicantName: draft.applicantName,
        applicantEmail: draft.applicantEmail,
        applicantPhone: draft.applicantPhone,
        responses: draft.responses ? JSON.parse(draft.responses) : {},
        updatedAt: draft.updatedAt
      }
    });
  } catch (error) {
    console.error('Error loading draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { applicantName, applicantEmail, applicantPhone, responses } = data;

    // Find the form
    const form = await prisma.form.findUnique({
      where: { slug }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert draft (create or update)
    const draft = await prisma.formDraft.upsert({
      where: {
        formId_userId: {
          formId: form.id,
          userId: user.id
        }
      },
      create: {
        formId: form.id,
        userId: user.id,
        applicantName,
        applicantEmail,
        applicantPhone,
        responses: JSON.stringify(responses)
      },
      update: {
        applicantName,
        applicantEmail,
        applicantPhone,
        responses: JSON.stringify(responses),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      updatedAt: draft.updatedAt 
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { slug }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete draft if it exists
    await prisma.formDraft.deleteMany({
      where: {
        formId: form.id,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 