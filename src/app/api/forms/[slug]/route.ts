import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

const normalizeId = (value: any, fallback: string) => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return value.toString();
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value?.toString === 'function') {
    const stringified = value.toString();
    if (stringified && stringified !== '[object Object]') {
      return stringified;
    }
  }
  return fallback;
};

const sanitizeOptions = (options: any): string[] => {
  if (!options) return [];

  if (Array.isArray(options)) {
    return Array.from(new Set(options.map(option => `${option}`.trim()).filter(Boolean)));
  }

  if (typeof options === 'string') {
    return Array.from(new Set(options
      .split('\n')
      .map(option => option.trim())
      .filter(Boolean)
    ));
  }

  if (typeof options === 'object') {
    return Array.from(new Set(
      Object.values(options)
        .map(option => `${option}`.trim())
        .filter(Boolean)
    ));
  }

  return [];
};

function normalizeSections(form: any) {
  const rawSections = Array.isArray(form?.sections) ? form.sections : [];
  const rawQuestions = Array.isArray(form?.questions) ? form.questions : [];

  const sections = (rawSections.length ? rawSections : [
    {
      id: `section-${form?.id || 'default'}`,
      title: form?.title || 'Section 1',
      description: form?.description || '',
      order: 0,
      questions: rawQuestions
    }
  ]).map((section: any, sectionIndex: number) => {
    const sectionId = normalizeId(section?.id || section?._id, `section-${sectionIndex}`);
    const sectionQuestions = Array.isArray(section?.questions)
      ? section.questions
      : rawQuestions.filter((question: any) => question?.sectionId === section?.id);

    const questions = sectionQuestions.map((question: any, questionIndex: number) => {
      return {
        id: normalizeId(question?.id || question?._id, `question-${sectionId}-${questionIndex}`),
        title: question?.title || question?.question || `Question ${questionIndex + 1}`,
        description: question?.description || '',
        type: question?.type || 'TEXT',
        required: Boolean(question?.required),
        order: typeof question?.order === 'number' ? question.order : questionIndex,
        options: sanitizeOptions(question?.options),
        minLength: question?.minLength ?? null,
        maxLength: question?.maxLength ?? null,
        pattern: question?.pattern || '',
        matrixRows: question?.matrixRows || '',
        matrixCols: question?.matrixCols || '',
        descriptionContent: question?.descriptionContent || '',
        sectionId,
        sectionOrder: typeof section?.order === 'number' ? section.order : sectionIndex,
        sectionTitle: section?.title || `Section ${sectionIndex + 1}`
      };
    });

    return {
      id: sectionId,
      title: section?.title || `Section ${sectionIndex + 1}`,
      description: section?.description || '',
      order: typeof section?.order === 'number' ? section.order : sectionIndex,
      questions
    };
  }).sort((a: any, b: any) => a.order - b.order);

  const flattenedQuestions = sections.flatMap((section: any) =>
    section.questions
      .map((question: any, index: number) => ({
        ...question,
        order: typeof question?.order === 'number' ? question.order : index
      }))
      .sort((a: any, b: any) => a.order - b.order)
  );

  return {
    sections,
    questions: flattenedQuestions
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || null;

    await client.connect();
    const db = client.db();

    const form = await db.collection('Form').findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if form is active (not isPublic, use isActive)
    if (!form.isActive) {
      return NextResponse.json({ error: 'This form is not currently available' }, { status: 403 });
    }

    // Get application count
    const applicationsCollection = db.collection('Application');
    const submissionCount = await applicationsCollection
      .countDocuments({ formId: form.id });

    let userSubmissionSummary: any = null;
    let userSubmissionCount = 0;
    if (userEmail) {
      userSubmissionCount = await applicationsCollection.countDocuments(
        { formId: form.id, applicantEmail: userEmail }
      );

      const latestSubmission = await applicationsCollection.findOne(
        { formId: form.id, applicantEmail: userEmail },
        { sort: { submittedAt: -1, createdAt: -1 } }
      );

      if (latestSubmission) {
        userSubmissionSummary = {
          submissionId: latestSubmission._id.toString(),
          submittedAt: latestSubmission.submittedAt || latestSubmission.createdAt,
          status: latestSubmission.status || 'SUBMITTED',
          totalSubmissions: userSubmissionCount,
        };
      }
    }

    // Don't return sensitive admin data
    const { sections, questions } = normalizeSections(form);

    const publicForm = {
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      isActive: form.isActive,
      deadline: form.deadline,
      requireAuth: Boolean(form.requireAuth), // Convert to proper boolean
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      questions,
      sections,
      submissionCount,
      isAttendanceForm: form.isAttendanceForm,
      allowMultiple: Boolean(form.allowMultiple),
      userSubmissionSummary,
    };

    return NextResponse.json(publicForm);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 