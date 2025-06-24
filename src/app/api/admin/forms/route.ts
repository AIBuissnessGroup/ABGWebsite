import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const forms = await prisma.form.findMany({
      include: {
        creator: {
          select: { name: true, email: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        applications: {
          select: { 
            id: true, 
            status: true, 
            submittedAt: true,
            applicantEmail: true 
          }
        },
        _count: {
          select: {
            applications: true,
            questions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingForm = await prisma.form.findUnique({
      where: { slug }
    });

    if (existingForm) {
      return NextResponse.json({ error: 'A form with this title already exists' }, { status: 400 });
    }

    const form = await prisma.form.create({
      data: {
        ...data,
        slug,
        createdBy: user.id
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            applications: true,
            questions: true
          }
        }
      }
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error creating form:', error);
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

    const data = await request.json();
    const { id, creator, questions, applications, _count, createdAt, createdBy, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Only include fields that can be updated
    const allowedFields = {
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      isActive: updateData.isActive,
      isPublic: updateData.isPublic,
      allowMultiple: updateData.allowMultiple,
      deadline: updateData.deadline,
      maxSubmissions: updateData.maxSubmissions,
      notifyOnSubmission: updateData.notifyOnSubmission,
      notificationEmail: updateData.notificationEmail,
      requireAuth: updateData.requireAuth,
      backgroundColor: updateData.backgroundColor,
      textColor: updateData.textColor,
      updatedAt: new Date()
    };

    const form = await prisma.form.update({
      where: { id },
      data: allowedFields,
      include: {
        creator: {
          select: { name: true, email: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            applications: true,
            questions: true
          }
        }
      }
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    await prisma.form.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 