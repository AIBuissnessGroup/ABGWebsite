import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { MongoClient } from 'mongodb';

const uri = "mongodb://abgdev:DevPass123@159.89.229.112:27018/abg-website-dev?authSource=admin"

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete all forms
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db('abg-website');
    
    // Delete all form responses first
    const responsesResult = await db.collection('formResponses').deleteMany({});
    console.log(`Deleted ${responsesResult.deletedCount} form responses`);
    
    // Delete all forms
    const formsResult = await db.collection('forms').deleteMany({});
    console.log(`Deleted ${formsResult.deletedCount} forms`);
    
    await client.close();

    return NextResponse.json({ 
      success: true,
      message: 'All forms and responses deleted successfully',
      deleted: {
        forms: formsResult.deletedCount,
        responses: responsesResult.deletedCount
      }
    });

  } catch (error) {
    console.error('Failed to delete forms:', error);
    return NextResponse.json({ 
      error: 'Failed to delete forms and responses' 
    }, { status: 500 });
  }
}