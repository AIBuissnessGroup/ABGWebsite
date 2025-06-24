import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await request.json();
    const { applicantName, applicantEmail, applicantPhone, responses } = data;

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find the form
    const form = await prisma.form.findUnique({
      where: { slug },
      include: {
        questions: true
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isActive) {
      return NextResponse.json({ error: 'This form is no longer accepting submissions' }, { status: 403 });
    }

    if (form.deadline && new Date() > form.deadline) {
      return NextResponse.json({ error: 'The submission deadline has passed' }, { status: 403 });
    }

    // Check authentication requirement
    if (form.requireAuth) {
      const session = await getServerSession();
      
      if (!session?.user?.email) {
        return NextResponse.json({ 
          error: 'Authentication required. Please sign in with your UMich Google account.' 
        }, { status: 401 });
      }

      if (!session.user.email.endsWith('@umich.edu')) {
        return NextResponse.json({ 
          error: 'This form requires a University of Michigan email address.' 
        }, { status: 403 });
      }

      // Override applicant email with authenticated email for security
      const authenticatedEmail = session.user.email;
      const authenticatedName = session.user.name || applicantName;
      
      // Use authenticated data
      data.applicantEmail = authenticatedEmail;
      data.applicantName = authenticatedName;
    }

    // Check if multiple submissions are allowed
    if (!form.allowMultiple) {
      const existingApplication = await prisma.application.findFirst({
        where: {
          formId: form.id,
          applicantEmail: data.applicantEmail || applicantEmail
        }
      });

      if (existingApplication) {
        return NextResponse.json({ 
          error: 'You have already submitted an application for this form' 
        }, { status: 400 });
      }
    }

    // Check max submissions limit
    if (form.maxSubmissions) {
      const submissionCount = await prisma.application.count({
        where: { formId: form.id }
      });

      if (submissionCount >= form.maxSubmissions) {
        return NextResponse.json({ 
          error: 'This form has reached its maximum number of submissions' 
        }, { status: 403 });
      }
    }

    // Validate required fields
    const requiredQuestions = form.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      const response = responses.find((r: any) => r.questionId === question.id);
      if (!response || !response.value) {
        return NextResponse.json({ 
          error: `Please answer the required question: ${question.title}` 
        }, { status: 400 });
      }
    }

    // Create application with responses
    const application = await prisma.application.create({
      data: {
        formId: form.id,
        applicantName: data.applicantName || applicantName,
        applicantEmail: data.applicantEmail || applicantEmail,
        applicantPhone,
        ipAddress,
        userAgent,
        responses: {
          create: responses.map((response: any) => {
            const question = form.questions.find(q => q.id === response.questionId);
            if (!question) return null;

            const responseData: any = {
              questionId: response.questionId
            };

            // Store response based on question type
            switch (question.type) {
              case 'TEXT':
              case 'TEXTAREA':
              case 'EMAIL':
              case 'PHONE':
              case 'URL':
                responseData.textValue = response.value;
                break;
              case 'NUMBER':
                responseData.numberValue = parseFloat(response.value);
                break;
              case 'DATE':
                responseData.dateValue = new Date(response.value);
                break;
              case 'BOOLEAN':
                responseData.booleanValue = Boolean(response.value);
                break;
              case 'SELECT':
              case 'RADIO':
                responseData.textValue = response.value;
                break;
              case 'CHECKBOX':
                responseData.selectedOptions = JSON.stringify(response.value);
                break;
              case 'FILE':
                responseData.fileUrl = response.value;
                break;
              default:
                responseData.textValue = response.value;
            }

            return responseData;
          }).filter(Boolean)
        }
      },
      include: {
        form: {
          select: { title: true, category: true }
        },
        responses: {
          include: {
            question: {
              select: { title: true, type: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully!',
      applicationId: application.id
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 