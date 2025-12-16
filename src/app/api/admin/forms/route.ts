import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

const normalizeId = (value: any) => {
  if (!value) {
    return crypto.randomUUID();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (value instanceof ObjectId) {
    return value.toString();
  }

  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }

  return crypto.randomUUID();
};

const coerceOrder = (value: any, fallback: number) => {
  return Number.isFinite(value) ? Number(value) : fallback;
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

function normalizeFormStructure(
  input: any,
  fallback?: { sections?: any[]; questions?: any[]; title?: string; slug?: string }
) {
  const baseTitle = input?.title || fallback?.title || 'Untitled Section';

  const rawSections = Array.isArray(input?.sections)
    ? input.sections
    : Array.isArray(fallback?.sections)
      ? fallback.sections
      : [];

  const rawQuestions = Array.isArray(input?.questions)
    ? input.questions
    : Array.isArray(fallback?.questions)
      ? fallback.questions
      : [];

  let workingSections = rawSections;

  if (!workingSections.length) {
    const defaultSectionId = rawSections?.[0]?.id || crypto.randomUUID();
    workingSections = [
      {
        id: defaultSectionId,
        title: baseTitle,
        description: '',
        questions: rawQuestions
      }
    ];
  }

  const normalizedSections = workingSections
    .map((section: any, sectionIndex: number) => {
      const sectionId = normalizeId(section?.id || section?._id);
      const sectionTitle = section?.title || `Section ${sectionIndex + 1}`;
      const sectionDescription = section?.description || '';
      const sectionOrder = coerceOrder(section?.order, sectionIndex);
      const sectionQuestions = Array.isArray(section?.questions)
        ? section.questions
        : section?.questionList
          ? section.questionList
          : [];

      const normalizedQuestions = sectionQuestions
        .map((question: any, questionIndex: number) => {
          const questionId = normalizeId(question?.id || question?._id);
          const order = coerceOrder(question?.order, questionIndex);

          return {
            id: questionId,
            title: question?.title || question?.question || `Question ${questionIndex + 1}`,
            question: question?.title || question?.question || `Question ${questionIndex + 1}`,
            description: question?.description || '',
            type: question?.type || 'TEXT',
            required: Boolean(question?.required),
            order,
            options: sanitizeOptions(question?.options),
            minLength: question?.minLength ?? null,
            maxLength: question?.maxLength ?? null,
            pattern: question?.pattern || '',
            matrixRows: question?.matrixRows || '',
            matrixCols: question?.matrixCols || '',
            descriptionContent: question?.descriptionContent || '',
            sectionId,
            sectionOrder,
            sectionTitle,
            createdAt: question?.createdAt || Date.now(),
            updatedAt: question?.updatedAt || Date.now()
          };
        })
        .sort((a: any, b: any) => a.order - b.order)
        .map((question: any, index: number) => ({
          ...question,
          order: index
        }));

      return {
        id: sectionId,
        title: sectionTitle,
        description: sectionDescription,
        order: sectionOrder,
        questions: normalizedQuestions
      };
    })
    .sort((a: any, b: any) => a.order - b.order)
    .map((section: any, index: number) => ({
      ...section,
      order: index,
      questions: section.questions.map((question: any) => ({
        ...question,
        sectionOrder: index,
        sectionTitle: section.title,
        sectionId: section.id
      }))
    }));

  const normalizedQuestions = normalizedSections
    .flatMap((section: any) => section.questions)
    .sort((a: any, b: any) =>
      (a.sectionOrder - b.sectionOrder) ||
      (a.order - b.order)
    );

  return {
    sections: normalizedSections,
    questions: normalizedQuestions
  };
}

function sanitizeSlackTargets(targets: any[]): any[] {
  if (!Array.isArray(targets)) {
    return [];
  }

  return targets
    .map((target: any) => {
      if (!target || !target.id || !target.type) {
        return null;
      }

      return {
        id: String(target.id),
        name: target.name || '',
        type: target.type === 'user' ? 'user' : 'channel',
      };
    })
    .filter(Boolean);
}

function buildNotificationConfig(payload: any, fallback: any, defaultEmail: string) {
  const previous = fallback || {};

  const incomingConfig = payload?.notificationConfig || {};
  const slackTargets = sanitizeSlackTargets(
    incomingConfig?.slack?.targets || payload?.slackTargets || previous?.slack?.targets || []
  );

  const rawWebhook =
    incomingConfig?.slack?.webhookUrl ??
    payload?.slackWebhookUrl ??
    previous?.slack?.webhookUrl ??
    null;

  const webhookUrl = rawWebhook === '' ? null : rawWebhook;

  const notificationEmail =
    incomingConfig?.email?.notificationEmail ??
    payload?.notificationEmail ??
    previous?.email?.notificationEmail ??
    defaultEmail;

  const notifyOnSubmission =
    typeof incomingConfig?.email?.notifyOnSubmission === 'boolean'
      ? incomingConfig.email.notifyOnSubmission
      : typeof payload?.notifyOnSubmission === 'boolean'
        ? payload.notifyOnSubmission
        : typeof previous?.email?.notifyOnSubmission === 'boolean'
          ? previous.email.notifyOnSubmission
          : true;

  const sendReceiptToSubmitter =
    typeof incomingConfig?.email?.sendReceiptToSubmitter === 'boolean'
      ? incomingConfig.email.sendReceiptToSubmitter
      : typeof payload?.sendReceiptToSubmitter === 'boolean'
        ? payload.sendReceiptToSubmitter
        : typeof previous?.email?.sendReceiptToSubmitter === 'boolean'
          ? previous.email.sendReceiptToSubmitter
          : false;

  return {
    slack: {
      webhookUrl,
      targets: slackTargets,
    },
    email: {
      notificationEmail,
      notifyOnSubmission,
      sendReceiptToSubmitter,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db();

    const forms = await db.collection('Form').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log('Forms API returning', forms.length, 'forms');
    forms.forEach((form, index) => {
      console.log(`Form ${index}: ${form.title}, Questions: ${form.questions ? form.questions.length : 'undefined'}`);
    });

    return NextResponse.json(safeJson(forms));
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db();

    const user = await db.collection('User').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();

    console.log('POST /api/admin/forms - Received data:', data);
    console.log('Questions in request:', data.questions ? data.questions.length + ' questions' : 'No questions field');

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingForm = await db.collection('Form').findOne({ slug });

    if (existingForm) {
      return NextResponse.json({ error: 'A form with this title already exists' }, { status: 400 });
    }

    const { questions, sections, ...formData } = data;
    const notificationConfig = buildNotificationConfig(data, undefined, user.email);
    const normalized = normalizeFormStructure(
      {
        ...formData,
        questions,
        sections
      },
      undefined
    );

    const form = {
      ...formData,
      id: crypto.randomUUID(),
      slug,
      questions: normalized.questions,
      sections: normalized.sections,
      createdBy: user._id.toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Ensure required fields have defaults
      backgroundColor: formData.backgroundColor || '#ffffff',
      textColor: formData.textColor || '#000000',
      category: formData.category || 'general',
      allowMultiple: Boolean(formData.allowMultiple),
      isAttendanceForm: Boolean(formData.isAttendanceForm),
      isActive: Boolean(formData.isActive ?? formData.isPublic ?? true),
      published: Boolean(formData.published),
      notificationConfig,
      // Also set top-level fields for backward compatibility
      notificationEmail: notificationConfig.email?.notificationEmail,
      notifyOnSubmission: notificationConfig.email?.notifyOnSubmission,
      sendReceiptToSubmitter: notificationConfig.email?.sendReceiptToSubmitter,
    };

    const result = await db.collection('Form').insertOne(form);
    const createdForm = await db.collection('Form').findOne({ _id: result.insertedId });

    return NextResponse.json(safeJson(createdForm));
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
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
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ID from URL parameter or request body
    const { searchParams } = new URL(request.url);
    const urlId = searchParams.get('id');

    const data = await request.json();
    const { id: bodyId, creator, applications, _count, createdAt, createdBy, ...updateData } = data;
    
    console.log('PUT /api/admin/forms - Received data:', data);
    console.log('Questions in PUT request:', data.questions ? data.questions.length + ' questions' : 'No questions field');
    
    const id = urlId || bodyId;
    
    console.log('PUT request data:', { urlId, bodyId, id, updateData });

    if (!id) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Get current form to check if title changed
    const currentForm = await db.collection('Form').findOne(
      { id },
      { projection: { title: 1, slug: 1, notificationConfig: 1, notificationEmail: 1, notifyOnSubmission: 1, sendReceiptToSubmitter: 1 } }
    );

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
      const existingForm = await db.collection('Form').findOne({
        slug,
        id: { $ne: id }
      });

      if (existingForm) {
        // Add a suffix to make it unique
        slug = `${slug}-${Date.now()}`;
      }
    }

    const normalized = normalizeFormStructure(updateData, currentForm as any);
    const notificationConfig = buildNotificationConfig(
      updateData,
      currentForm.notificationConfig,
      currentForm.notificationEmail || session.user.email || ''
    );

    // Only include fields that can be updated
    const allowedFields: any = {
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      slug,
      questions: normalized.questions,
      sections: normalized.sections,
      isActive: updateData.isActive ?? updateData.isPublic,
      allowMultiple: updateData.allowMultiple,
      deadline: updateData.deadline,
      maxSubmissions: updateData.maxSubmissions,
      requireAuth: updateData.requireAuth,
      backgroundColor: updateData.backgroundColor,
      textColor: updateData.textColor,
      updatedAt: new Date(),
      notificationConfig,
      // Also set top-level fields for backward compatibility
      notificationEmail: notificationConfig.email?.notificationEmail,
      notifyOnSubmission: notificationConfig.email?.notifyOnSubmission,
      sendReceiptToSubmitter: notificationConfig.email?.sendReceiptToSubmitter,
    };

    // Remove undefined values (but keep false and other falsy values that are valid)
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    console.log('Updating form with fields:', allowedFields);
    console.log('📧 Email receipt setting being saved:', notificationConfig.email?.sendReceiptToSubmitter);
    console.log('📧 Top-level sendReceiptToSubmitter being saved:', allowedFields.sendReceiptToSubmitter);

    await db.collection('Form').updateOne(
      { id },
      { $set: allowedFields }
    );

    const form = await db.collection('Form').findOne({ id });
    console.log('📧 Form after update - sendReceiptToSubmitter:', form?.sendReceiptToSubmitter);
    console.log('📧 Form after update - notificationConfig:', JSON.stringify(form?.notificationConfig, null, 2));

    if (!form) {
      return NextResponse.json({ error: 'Form not found after update' }, { status: 404 });
    }

    console.log('Form updated successfully:', { id: form.id, slug: form.slug, title: form.title });
    return NextResponse.json(safeJson(form));
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    await db.collection('Form').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 