import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { authOptions } from '@/lib/auth';

// Configure runtime for handling large requests
export const maxDuration = 60; // seconds

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

// GET - Load user's draft for this form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const formsCollection = db.collection('Form');
    const usersCollection = db.collection('User');
    const draftsCollection = db.collection('FormDraft');

    // Find the form
    const form = await formsCollection.findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Find the user
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find existing draft
    const draft = await draftsCollection.findOne({
      formId: form.id,
      userId: user.id
    });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({
      draft: {
        applicantName: draft.applicantName,
        applicantEmail: draft.applicantEmail,
        applicantPhone: draft.applicantPhone,
        responses: draft.responses ? JSON.parse(draft.responses) : {},
        updatedAt: draft.updatedAt
      }
    });
  } catch (error) {
    console.error('Error loading draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// POST - Save draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { applicantName, applicantEmail, applicantPhone, responses } = data;

    await client.connect();
    const db = client.db('abg-website');
    const formsCollection = db.collection('Form');
    const usersCollection = db.collection('User');
    const draftsCollection = db.collection('FormDraft');

    // Find the form
    const form = await formsCollection.findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Find the user
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert draft (create or update)
    const updateData = {
      formId: form.id,
      userId: user.id,
      applicantName,
      applicantEmail,
      applicantPhone,
      responses: JSON.stringify(responses),
      updatedAt: new Date()
    };

    const draft = await draftsCollection.findOneAndUpdate(
      { formId: form.id, userId: user.id },
      { $set: updateData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ 
      success: true, 
      updatedAt: draft?.updatedAt 
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// DELETE - Delete draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const formsCollection = db.collection('Form');
    const usersCollection = db.collection('User');
    const draftsCollection = db.collection('FormDraft');

    // Find the form
    const form = await formsCollection.findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Find the user
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete draft if it exists
    await draftsCollection.deleteMany({
      formId: form.id,
      userId: user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 