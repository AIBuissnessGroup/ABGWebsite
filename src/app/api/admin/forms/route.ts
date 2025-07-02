import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
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

    const { questions, ...formData } = data;

    const form = await prisma.form.create({
      data: {
        ...formData,
        slug,
        createdBy: user.id,
        questions: questions && questions.length > 0 ? {
          create: questions
        } : undefined
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
    const session = await getServerSession(authOptions);
    
    console.log('PUT /api/admin/forms - Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ID from URL parameter or request body
    const { searchParams } = new URL(request.url);
    const urlId = searchParams.get('id');

    const data = await request.json();
    const { id: bodyId, creator, questions, applications, _count, createdAt, createdBy, ...updateData } = data;
    
    const id = urlId || bodyId;
    
    console.log('PUT request data:', { urlId, bodyId, id, updateData });

    if (!id) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Get current form to check if title changed
    const currentForm = await prisma.form.findUnique({
      where: { id },
      select: { title: true, slug: true }
    });

    if (!currentForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Generate new slug if title changed
    let slug = currentForm.slug;
    if (updateData.title && updateData.title !== currentForm.title) {
      slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists (but exclude current form)
      const existingForm = await prisma.form.findFirst({
        where: { 
          slug,
          id: { not: id }
        }
      });

      if (existingForm) {
        // Add a suffix to make it unique
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Only include fields that can be updated
    const allowedFields = {
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      slug: slug,
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

    // Handle questions update - delete existing and create new ones
    const updateOperations: any = {
      ...allowedFields
    };

    if (questions && Array.isArray(questions)) {
      updateOperations.questions = {
        deleteMany: {},  // Delete all existing questions
        create: questions.map((q, index) => ({
          title: q.title,
          description: q.description || '',
          type: q.type,
          required: q.required || false,
          order: index,
          options: (q.type === 'SELECT' || q.type === 'RADIO' || q.type === 'CHECKBOX') && q.options 
            ? q.options 
            : null,
          minLength: q.minLength || null,
          maxLength: q.maxLength || null,
          pattern: q.pattern || null
        }))
      };
    }

    console.log('Updating form with operations:', updateOperations);

    const form = await prisma.form.update({
      where: { id },
      data: updateOperations,
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
      }
    });

    console.log('Form updated successfully:', { id: form.id, slug: form.slug, title: form.title });
    return NextResponse.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
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