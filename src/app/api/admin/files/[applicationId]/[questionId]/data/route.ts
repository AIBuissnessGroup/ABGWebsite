import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { isAdmin } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string; questionId: string }> }
) {
  try {
    const { applicationId, questionId } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db();
    const applicationsCollection = db.collection('Application');

    // Find the application and the specific response
    const application = await applicationsCollection.findOne({
      _id: new ObjectId(applicationId)
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Find the specific response with the file
    const response = application.responses?.find((r: any) => r.questionId === questionId);

    if (!response || !response.fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Return file metadata and base64 data for preview
    return NextResponse.json({
      fileName: response.fileName,
      fileSize: response.fileSize,
      fileType: response.fileType,
      fileData: response.fileData
    });

  } catch (error) {
    console.error('Error fetching file data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}