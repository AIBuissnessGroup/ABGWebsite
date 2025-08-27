import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await client.connect();
    const db = client.db();

    const form = await db.collection('Form').findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isPublic) {
      return NextResponse.json({ error: 'This form is not publicly accessible' }, { status: 403 });
    }

    // Get questions for this form
    const questions = await db.collection('FormQuestion')
      .find({ formId: form._id.toString() })
      .sort({ order: 1 })
      .toArray();

    // Get application count
    const submissionCount = await db.collection('Application')
      .countDocuments({ formId: form._id.toString() });

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
      questions: questions.map((q: any) => ({
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
      submissionCount
    };

    return NextResponse.json(publicForm);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 