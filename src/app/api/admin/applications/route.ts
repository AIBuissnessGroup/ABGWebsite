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
    const db = client.db();
    const applicationsCollection = db.collection('Application');
    const formsCollection = db.collection('Form');

    const whereClause: any = {};
    if (formId) whereClause.formId = formId;
    if (status) whereClause.status = status;

    // Get applications
    const applications = await applicationsCollection.find(whereClause).toArray();

    // Enrich with form data
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const form = await formsCollection.findOne(
          { id: app.formId },
          { projection: { title: 1, slug: 1, category: 1, questions: 1 } }
        );

        // Load reviewer info if application has been reviewed
        let reviewer = null;
        if (app.reviewedBy) {
          const usersCollection = db.collection('User');
          reviewer = await usersCollection.findOne(
            { id: app.reviewedBy },
            { projection: { name: 1, email: 1 } }
          );
        }

        // Responses are now embedded in the application document
        // Transform them to match the expected format for the admin panel
        const responses = (app.responses || []).map((response: any, index: number) => {
          // Find the question details from the form
          const question = form?.questions?.find((q: any) => q.id === response.questionId);
          
          if (!question) {
            console.log(`Warning: Question not found for ID ${response.questionId} in form ${form?.title}`);
          }
          
          return {
            id: `${app._id}-response-${index}`, // Generate a unique ID for the response
            questionId: response.questionId,
            question: question || { title: `Unknown Question (${response.questionId})` },
            textValue: response.textValue,
            numberValue: response.numberValue,
            dateValue: response.dateValue,
            booleanValue: response.booleanValue,
            selectedOptions: response.selectedOptions,
            fileUrl: response.fileUrl,
            fileName: response.fileName,
            fileSize: response.fileSize,
            fileType: response.fileType,
            fileData: response.fileData,
            applicationId: app._id.toString()
          };
        });

        return {
          ...app,
          id: app._id.toString(), // Ensure ID is a string
          form,
          reviewer,
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
    const db = client.db();
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