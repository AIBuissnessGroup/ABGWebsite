import { NextRequest, NextResponse } from 'next/server';

// Mock data for internship projects
let internshipProjects = [
  {
    id: '1',
    title: 'AI Research Intern',
    description: 'Work on cutting-edge NLP projects and machine learning model development. You will collaborate with our research team to develop innovative AI solutions.',
    companyId: '1',
    linkedForm: '1735847762089', // Example form ID - can be linked to forms from the forms system
    status: 'OPEN',
    duration: '12 weeks',
    location: 'Remote',
    type: 'Research',
    skills: '["Python", "PyTorch", "NLP", "Machine Learning"]',
    requirements: 'Strong programming skills, machine learning background, and enthusiasm for AI research.',
    applicationDeadline: '2025-03-01',
    applicationsCount: 5,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'ML Engineering Intern',
    description: 'Build production ML pipelines and deploy AI models at scale. Work with our engineering team to bring AI solutions to production.',
    companyId: '2',
    linkedForm: '', // No form linked yet
    status: 'FILLED',
    duration: '10 weeks',
    location: 'San Francisco, CA',
    type: 'Engineering',
    skills: '["Python", "Docker", "AWS", "MLOps", "Kubernetes"]',
    requirements: 'Experience with cloud platforms, containerization, and ML deployment.',
    applicationDeadline: '2025-02-15',
    applicationsCount: 12,
    active: true,
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    return NextResponse.json(internshipProjects);
  } catch (error) {
    console.error('Error fetching internship projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newProject = {
      id: Date.now().toString(),
      ...data,
      applicationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    internshipProjects.push(newProject);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating internship project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    const projectIndex = internshipProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    internshipProjects[projectIndex] = {
      ...internshipProjects[projectIndex],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(internshipProjects[projectIndex]);
  } catch (error) {
    console.error('Error updating internship project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    const projectIndex = internshipProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    internshipProjects.splice(projectIndex, 1);
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 