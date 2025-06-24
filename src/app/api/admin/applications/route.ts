import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (formId) whereClause.formId = formId;
    if (status) whereClause.status = status;

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        form: {
          select: { title: true, slug: true, category: true }
        },
        responses: {
          include: {
            question: {
              select: { title: true, type: true }
            }
          }
        },
        reviewer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...updateData,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        form: {
          select: { title: true, slug: true, category: true }
        },
        responses: {
          include: {
            question: {
              select: { title: true, type: true }
            }
          }
        },
        reviewer: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 