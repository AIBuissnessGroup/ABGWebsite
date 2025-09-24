import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    
    // Find the application for this email
    const application = await db.collection('Application').findOne({
      applicantEmail: decodedEmail
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    console.log('Found application:', {
      id: application._id,
      formId: application.formId,
      formIdType: typeof application.formId,
      email: application.applicantEmail
    });

    // Get the form details to understand question structure
    let form;
    try {
      // Try to find form by ObjectId first
      if (ObjectId.isValid(application.formId)) {
        form = await db.collection('Form').findOne({
          _id: new ObjectId(application.formId)
        });
      }
      
      // If not found or invalid ObjectId, try by string id
      if (!form) {
        form = await db.collection('Form').findOne({
          id: application.formId
        });
      }
      
      // If still not found, try by title for the specific form we want
      if (!form) {
        form = await db.collection('Form').findOne({
          title: { $regex: /ABG.*Fall.*2025.*Project.*Team.*Application/i }
        });
      }
    } catch (error) {
      console.error('Error finding form:', error);
      // Fallback to finding by title
      form = await db.collection('Form').findOne({
        title: { $regex: /ABG.*Fall.*2025.*Project.*Team.*Application/i }
      });
    }

    console.log('Form search result:', {
      found: !!form,
      formId: form?._id,
      title: form?.title
    });

    if (!form) {
      console.warn('Form not found, returning application data without form structure');
      // Return application data without form structure as fallback
      const fallbackResponse = {
        submissionId: application._id,
        submittedAt: application.submittedAt,
        applicantName: application.applicantName,
        applicantEmail: application.applicantEmail,
        responses: application.responses,
        formTitle: 'Application Form (Form details not found)',
        questions: application.responses.map((response: any, index: number) => ({
          id: response.questionId || `question_${index}`,
          title: `Question ${index + 1}`,
          type: 'TEXT',
          required: false
        }))
      };
      return NextResponse.json(fallbackResponse);
    }

    // Structure the response data
    const structuredResponse = {
      submissionId: application._id,
      submittedAt: application.submittedAt,
      applicantName: application.applicantName,
      applicantEmail: application.applicantEmail,
      responses: application.responses,
      formTitle: form.title,
      questions: form.questions
    };

    return NextResponse.json(structuredResponse);
    
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}