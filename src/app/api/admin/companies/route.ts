import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

const client = new MongoClient(process.env.DATABASE_URL!);

// Helper function to handle BigInt serialization
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const companies = await db.collection('Company').find({}).sort({ name: 1 }).toArray();

    return NextResponse.json(safeJson(companies));
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    await client.connect();
    const db = client.db('abg-website');
    
    const company = {
      id: `company-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      logoUrl: data.logoUrl || '',
      website: data.website || '',
      industry: data.industry || '',
      size: data.size || '',
      location: data.location || '',
      contactEmail: data.contactEmail || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = await db.collection('Company').insertOne(company);
    
    return NextResponse.json(safeJson({ ...company, _id: result.insertedId }));
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const urlId = searchParams.get('id');
    
    const data = await request.json();
    const id = urlId || data.id;

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    await client.connect();
    const db = client.db('abg-website');
    
    const updateData = {
      name: data.name,
      description: data.description || '',
      logoUrl: data.logoUrl || '',
      website: data.website || '',
      industry: data.industry || '',
      size: data.size || '',
      location: data.location || '',
      contactEmail: data.contactEmail || '',
      updatedAt: Date.now()
    };

    const result = await db.collection('Company').findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(safeJson(result));
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('abg-website');

    // Check if company has partnerships before deleting
    const partnerships = await db.collection('ProjectPartnership').countDocuments({ companyId: id });

    if (partnerships > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete company with existing partnerships. Remove partnerships first.' 
      }, { status: 400 });
    }

    const result = await db.collection('Company').deleteOne({ id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  } finally {
    await client.close();
  }
} 