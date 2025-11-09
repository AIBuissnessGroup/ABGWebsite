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
    return NextResponse.json(internshipsStore.getProjects());
  } catch (error) {
    console.error('Error fetching internship projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const newProject = {
      id: Date.now().toString(),
      ...data,
      applicationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    internshipsStore.addProject(newProject);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating internship project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
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
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const updatedProject = internshipsStore.updateProject(id, data);
    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating internship project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const deleted = internshipsStore.deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
