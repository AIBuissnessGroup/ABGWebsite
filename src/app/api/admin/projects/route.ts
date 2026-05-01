import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';



export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    
    const db = await getDb();
    
    // Get projects with published: true
    const projects = await db.collection('Project').find({ published: true }).toArray();
    
    // Get related data for each project
    for (const project of projects) {
      // Get team members
      project.teamMembers = await db.collection('ProjectTeamMember')
        .find({ projectId: project.id }).toArray();
      
      // Get funding
      project.funding = await db.collection('ProjectFunding')
        .find({ projectId: project.id }).toArray();
      
      // Get partnerships (without company data)
      project.partnerships = await db.collection('ProjectPartnership')
        .find({ projectId: project.id }).toArray();
    }
    
    // Sort by featured (desc) then createdAt (desc)
    projects.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  } finally {
    
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const db = await getDb();

    // Find the user to get their ID, fall back to email if no User doc exists
    const user = await db.collection('User').findOne({ email: session.user.email });

    const data = await request.json();
    
    // Generate a unique id from title if not provided
    const projectId = data.id || data.title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const project = {
      id: projectId,
      title: data.title,
      description: data.description,
      status: data.status || 'PLANNING',
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget || null,
      progress: data.progress || 0,
      objectives: data.objectives || '',
      outcomes: data.outcomes || null,
      technologies: data.technologies || '',
      links: data.links || null,
      imageUrl: data.imageUrl || null,
      featured: data.featured || false,
      published: data.published !== undefined ? data.published : true,
      createdBy: user ? user._id.toString() : session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('Project').insertOne(project);
    const createdProject = await db.collection('Project').findOne({ _id: result.insertedId });
    
    if (!createdProject) {
      return NextResponse.json({ error: 'Failed to retrieve created project' }, { status: 500 });
    }
    
    // Add empty relations for compatibility
    createdProject.teamMembers = [];
    createdProject.funding = [];
    createdProject.partnerships = [];

    return NextResponse.json(createdProject);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  } finally {
    
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    
    const db = await getDb();
    
    const updateData = {
      title: data.title,
      description: data.description,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget || null,
      progress: data.progress || 0,
      objectives: data.objectives || '',
      outcomes: data.outcomes || null,
      technologies: data.technologies || '',
      links: data.links || null,
      imageUrl: data.imageUrl || null,
      featured: data.featured || false,
      published: data.published !== undefined ? data.published : true,
      updatedAt: new Date()
    };

    // Use _id if provided, otherwise use id field
    const query = data._id ? { _id: new ObjectId(data._id) } : { id: data.id };
    
    await db.collection('Project').updateOne(query, { $set: updateData });

    const project = await db.collection('Project').findOne(query);
    
    // Get related data
    if (project) {
      project.teamMembers = await db.collection('ProjectTeamMember')
        .find({ projectId: project.id }).toArray();
      project.funding = await db.collection('ProjectFunding')
        .find({ projectId: project.id }).toArray();
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  } finally {
    
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const _id = searchParams.get('_id');

    if (!id && !_id) {
      return NextResponse.json({ error: 'Project ID or _id required' }, { status: 400 });
    }

    
    const db = await getDb();

    // Use _id if provided, otherwise use id field
    const query = _id ? { _id: new ObjectId(_id) } : { id: id };
    
    const result = await db.collection('Project').deleteOne(query);
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  } finally {
    
  }
} 
