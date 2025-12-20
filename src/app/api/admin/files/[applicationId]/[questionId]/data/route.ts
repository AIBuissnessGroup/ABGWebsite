import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { isAdmin } from '@/lib/admin';

const client = createMongoClient();

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