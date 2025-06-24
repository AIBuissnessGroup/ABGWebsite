import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const form = await prisma.form.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isPublic) {
      return NextResponse.json({ error: 'This form is not publicly accessible' }, { status: 403 });
    }

    // Don't return sensitive admin data
    const publicForm = {
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      isActive: form.isActive,
      deadline: form.deadline,
      requireAuth: form.requireAuth,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      questions: form.questions.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        required: q.required,
        order: q.order,
        options: q.options ? JSON.parse(q.options) : null,
        minLength: q.minLength,
        maxLength: q.maxLength,
        pattern: q.pattern
      })),
      submissionCount: form._count.applications
    };

    return NextResponse.json(publicForm);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 