import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

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
    if (!isAdminEmail(session.user.email)) {
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

    const { questions, ...formData } = data;

    const form = {
      ...formData,
      id: crypto.randomUUID(),
      slug,
      questions: questions || [], // Include questions in the form
      createdBy: user._id.toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Ensure required fields have defaults
      backgroundColor: formData.backgroundColor || '#ffffff',
      textColor: formData.textColor || '#000000',
      category: formData.category || 'general',
      notificationEmail: formData.notificationEmail || user.email,
      allowMultiple: formData.allowMultiple ? 1 : 0,
      isAttendanceForm: formData.isAttendanceForm ? 1 : 0,
      isPublic: formData.isPublic ? 1 : 0,
      published: formData.published ? 1 : 0
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
    if (!isAdminEmail(session.user.email)) {
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
    const currentForm = await db.collection('Form').findOne({ id }, { projection: { title: 1, slug: 1 } });

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

    // Only include fields that can be updated
    const allowedFields: any = {
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      slug,
      questions: updateData.questions || [], // Include questions in updates
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

    // Remove undefined values
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    console.log('Updating form with fields:', allowedFields);

    await db.collection('Form').updateOne(
      { id },
      { $set: allowedFields }
    );

    const form = await db.collection('Form').findOne({ id });

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
    if (!isAdminEmail(session.user.email)) {
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