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

    // Get application count
    const submissionCount = await db.collection('Application')
      .countDocuments({ formId: form.id });

    // Don't return sensitive admin data
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
      questions: form.questions || [], // Use questions directly from the form document
      submissionCount,
      isAttendanceForm: form.isAttendanceForm
    };

    return NextResponse.json(publicForm);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 