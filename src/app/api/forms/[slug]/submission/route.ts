import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';

const client = createMongoClient();

function normalizeQuestionMap(form: any) {
  const map = new Map<string, any>();

  const sections = Array.isArray(form?.sections) ? form.sections : [];
  const questions = Array.isArray(form?.questions) ? form.questions : [];

  if (sections.length) {
    sections.forEach((section: any) => {
      (Array.isArray(section?.questions) ? section.questions : []).forEach((question: any) => {
        const id = String(question?.id || question?._id || '');
        if (id) {
          map.set(id, {
            id,
            title: question?.title || question?.question || 'Untitled question',
            type: question?.type || 'TEXT',
            matrixRows: question?.matrixRows || undefined,
            matrixColumns: question?.matrixColumns || undefined,
          });
        }
      });
    });
  } else {
    questions.forEach((question: any) => {
      const id = String(question?.id || question?._id || '');
      if (id) {
        map.set(id, {
          id,
          title: question?.title || question?.question || 'Untitled question',
          type: question?.type || 'TEXT',
          matrixRows: question?.matrixRows || undefined,
          matrixColumns: question?.matrixColumns || undefined,
        });
      }
    });
  }

  return map;
}

function formatResponseValue(value: any, questionType: string) {
  if (value === null || value === undefined) {
    return null;
  }

  switch (questionType) {
    case 'NUMBER':
      return typeof value === 'number' ? value : Number(value);
    case 'CHECKBOX':
    case 'MATRIX':
      if (Array.isArray(value)) {
        return value;
      }
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        return Array.isArray(value) ? value : [value];
      }
    case 'BOOLEAN':
      return value === true || value === 'true';
    case 'DATE':
      return value instanceof Date ? value : new Date(value);
    default:
      return value;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const client = createMongoClient();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const getAllSubmissions = searchParams.get('all') === 'true';

    await client.connect();
    const db = client.db();
    const formsCollection = db.collection('Form');
    const applicationsCollection = db.collection('Application');

    const form = await formsCollection.findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const questionMap = normalizeQuestionMap(form);

    // If requesting all submissions
    if (getAllSubmissions) {
      const allSubmissions = await applicationsCollection.find(
        { formId: form.id, applicantEmail: session.user.email },
        { sort: { submittedAt: -1, createdAt: -1 } }
      ).toArray();

      const submissions = allSubmissions.map(submission => ({
        submissionId: submission._id.toString(),
        submittedAt: submission.submittedAt || submission.createdAt,
        status: submission.status || 'SUBMITTED',
        responses: (submission.responses || []).map((response: any) => {
          const question = questionMap.get(String(response.questionId));
          const questionType = question?.type || 'TEXT';

          let value: any = null;
          if (response.textValue !== undefined) {
            value = response.textValue;
          } else if (response.numberValue !== undefined) {
            value = response.numberValue;
          } else if (response.dateValue) {
            value = response.dateValue;
          } else if (response.booleanValue !== undefined) {
            value = response.booleanValue;
          } else if (response.selectedOptions) {
            try {
              const parsed = JSON.parse(response.selectedOptions);
              value = parsed;
            } catch (error) {
              value = response.selectedOptions;
            }
          } else if (response.fileName) {
            value = {
              fileName: response.fileName,
              fileSize: response.fileSize,
              fileType: response.fileType,
              downloadUrl: `${process.env.NEXTAUTH_URL || 'https://abgumich.org'}/api/files/${submission._id}/${response.questionId}`,
            };
          }

          return {
            questionId: response.questionId,
            questionTitle: question?.title || 'Untitled question',
            type: questionType,
            matrixRows: question?.matrixRows,
            matrixColumns: question?.matrixColumns,
            value: formatResponseValue(value, questionType),
          };
        })
      }));

      return NextResponse.json({
        form: {
          id: form.id,
          title: form.title,
        },
        submissions,
      });
    }

    const query: any = { formId: form.id, applicantEmail: session.user.email };

    if (submissionId) {
      query._id = ObjectId.isValid(submissionId) ? new ObjectId(submissionId) : submissionId;
    }

    const submission = await applicationsCollection.findOne(query, {
      sort: { submittedAt: -1, createdAt: -1 },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const responses = (submission.responses || []).map((response: any) => {
      const question = questionMap.get(String(response.questionId));
      const questionType = question?.type || 'TEXT';

      let value: any = null;
      if (response.textValue !== undefined) {
        value = response.textValue;
      } else if (response.numberValue !== undefined) {
        value = response.numberValue;
      } else if (response.dateValue) {
        value = response.dateValue;
      } else if (response.booleanValue !== undefined) {
        value = response.booleanValue;
      } else if (response.selectedOptions) {
        try {
          const parsed = JSON.parse(response.selectedOptions);
          value = parsed;
        } catch (error) {
          value = response.selectedOptions;
        }
      } else if (response.fileName) {
        value = {
          fileName: response.fileName,
          fileSize: response.fileSize,
          fileType: response.fileType,
          downloadUrl: `${process.env.NEXTAUTH_URL || 'https://abgumich.org'}/api/files/${submission._id}/${response.questionId}`,
        };
      }

      return {
        questionId: response.questionId,
        questionTitle: question?.title || 'Untitled question',
        type: questionType,
        matrixRows: question?.matrixRows,
        matrixColumns: question?.matrixColumns,
        value: formatResponseValue(value, questionType),
      };
    });

    return NextResponse.json({
      submissionId: submission._id.toString(),
      submittedAt: submission.submittedAt || submission.createdAt,
      status: submission.status || 'SUBMITTED',
      form: {
        id: form.id,
        title: form.title,
      },
      responses,
    });
  } catch (error) {
    console.error('Error fetching submission summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}
