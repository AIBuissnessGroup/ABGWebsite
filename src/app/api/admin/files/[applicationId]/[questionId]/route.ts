import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

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
    if (!isAdminEmail(session.user.email)) {
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

    // Extract the base64 data and mime type
    const fileData = response.fileData;
    
    // Check if it's a data URL (starts with data:)
    if (fileData.startsWith('data:')) {
      const [header, base64Data] = fileData.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers for file download
      const headers = new Headers();
      headers.set('Content-Type', mimeType || response.fileType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${response.fileName || 'file'}"`);
      headers.set('Content-Length', buffer.length.toString());
      
      return new NextResponse(buffer, { headers });
    } else {
      // If not a data URL, treat as raw base64
      const buffer = Buffer.from(fileData, 'base64');
      
      const headers = new Headers();
      headers.set('Content-Type', response.fileType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${response.fileName || 'file'}"`);
      headers.set('Content-Length', buffer.length.toString());
      
      return new NextResponse(buffer, { headers });
    }

  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}