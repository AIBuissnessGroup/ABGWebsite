import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { internshipsStore } from '@/lib/internships/store';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(internshipsStore.getCompanies());
  } catch (error) {
    console.error('Error fetching internship companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const newCompany = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    internshipsStore.addCompany(newCompany);

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating internship company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const updatedCompany = internshipsStore.updateCompany(id, data);
    if (!updatedCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating internship company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const deleted = internshipsStore.deleteCompany(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}
