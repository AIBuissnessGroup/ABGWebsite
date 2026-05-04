import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/server-admin';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb('abg-website');
    const placements = await db
      .collection('MemberInternship')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(placements);
  } catch (error) {
    console.error('Error fetching member internships:', error);
    return NextResponse.json({ error: 'Failed to fetch placements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const db = await getDb('abg-website');

    const placement = {
      name: data.name,
      company: data.company,
      industry: data.industry || '',
      role: data.role,
      bio: data.bio || '',
      linkedin: data.linkedin || '',
      memberImageUrl: data.memberImageUrl || '',
      companyLogoUrl: data.companyLogoUrl || '',
      term: data.term || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('MemberInternship').insertOne(placement);
    return NextResponse.json({ ...placement, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error creating member internship:', error);
    return NextResponse.json({ error: 'Failed to create placement' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { _id, ...updateFields } = data;
    if (!_id) {
      return NextResponse.json({ error: '_id required' }, { status: 400 });
    }

    const db = await getDb('abg-website');
    const { ObjectId } = await import('mongodb');

    await db.collection('MemberInternship').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    const updated = await db.collection('MemberInternship').findOne({ _id: new ObjectId(_id) });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating member internship:', error);
    return NextResponse.json({ error: 'Failed to update placement' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const db = await getDb('abg-website');
    const { ObjectId } = await import('mongodb');

    const result = await db.collection('MemberInternship').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member internship:', error);
    return NextResponse.json({ error: 'Failed to delete placement' }, { status: 500 });
  }
}
