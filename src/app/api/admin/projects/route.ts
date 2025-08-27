import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
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
      
      // Get partnerships with company data
      const partnerships = await db.collection('ProjectPartnership')
        .find({ projectId: project.id }).toArray();
      
      for (const partnership of partnerships) {
        partnership.company = await db.collection('Company')
          .findOne({ id: partnership.companyId });
      }
      project.partnerships = partnerships;
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
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db();

    // Find the user to get their ID
    const user = await db.collection('User').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    
    const project = {
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
      createdBy: user._id.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('Project').insertOne(project);
    const createdProject = await db.collection('Project').findOne({ _id: result.insertedId });
    
    // Add empty relations for compatibility
    createdProject.teamMembers = [];
    createdProject.funding = [];
    createdProject.partnerships = [];

    return NextResponse.json(createdProject);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    await client.connect();
    const db = client.db();
    
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

    await db.collection('Project').updateOne(
      { _id: new ObjectId(data.id) },
      { $set: updateData }
    );

    const project = await db.collection('Project').findOne({ _id: new ObjectId(data.id) });
    
    // Get related data
    project.teamMembers = await db.collection('ProjectTeamMember')
      .find({ projectId: data.id }).toArray();
    project.funding = await db.collection('ProjectFunding')
      .find({ projectId: data.id }).toArray();

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    await db.collection('Project').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  } finally {
    await client.close();
  }
} 