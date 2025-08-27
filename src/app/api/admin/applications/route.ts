import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const status = searchParams.get('status');

    await client.connect();
    const db = client.db('abg-website');
    const applicationsCollection = db.collection('Application');
    const formsCollection = db.collection('Form');
    const responsesCollection = db.collection('ApplicationResponse');

    const whereClause: any = {};
    if (formId) whereClause.formId = formId;
    if (status) whereClause.status = status;

    // Get applications
    const applications = await applicationsCollection.find(whereClause).toArray();

    // Enrich with form data and responses
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const form = await formsCollection.findOne(
          { id: app.formId },
          { projection: { title: 1, slug: 1, category: 1 } }
        );

        const responses = await responsesCollection.find({ applicationId: app.id }).toArray();

        return {
          ...app,
          form,
          responses
        };
      })
    );

    return NextResponse.json(enrichedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const usersCollection = db.collection('User');
    const applicationsCollection = db.collection('Application');

    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const updatedData = {
      ...updateData,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };

    const result = await applicationsCollection.findOneAndUpdate(
      { id },
      { $set: updatedData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = result;

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 