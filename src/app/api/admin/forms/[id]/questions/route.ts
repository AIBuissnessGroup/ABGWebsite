import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('FormQuestion');

    const questions = await collection.find({ formId: id }).sort({ order: 1 }).toArray();

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching form questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
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

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('FormQuestion');

    // Get the highest order number for this form
    const lastQuestion = await collection.findOne(
      { formId },
      { sort: { order: -1 } }
    );

    const newOrder = (lastQuestion?.order || 0) + 1;

    const questionData = {
      id: crypto.randomUUID(),
      formId,
      type: data.type,
      question: data.question,
      required: Boolean(data.required),
      options: data.options || null,
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(questionData);
    const question = { ...questionData, _id: result.insertedId };

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error creating form question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
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

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('FormQuestion');

    const updateData = {
      type: data.type,
      question: data.question,
      required: Boolean(data.required),
      options: data.options || null,
      order: data.order,
      updatedAt: new Date()
    };

    const result = await collection.findOneAndUpdate(
      { id: data.id, formId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating form question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
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
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('FormQuestion');

    const result = await collection.deleteOne({ id: questionId, formId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  } finally {
    await client.close();
  }
}