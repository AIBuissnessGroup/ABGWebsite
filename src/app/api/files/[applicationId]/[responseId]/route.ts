import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string; responseId: string }> }
) {
  try {
    const { applicationId, responseId } = await params;
    
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

    // Find the application
    const application = await db.collection('Application').findOne({
      _id: new ObjectId(applicationId)
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Find the specific response with the file
    const response = application.responses?.find((r: any) => r.questionId === responseId);

    if (!response || !response.fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Parse the base64 data
    const base64Data = response.fileData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', response.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${response.fileName}"`);
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, { headers });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}
