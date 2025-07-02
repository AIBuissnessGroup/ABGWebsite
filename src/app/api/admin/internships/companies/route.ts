import { NextRequest, NextResponse } from 'next/server';

// Mock data for internship companies
let internshipCompanies = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    description: 'Leading AI technology company specializing in natural language processing and machine learning solutions.',
    logoUrl: '',
    website: 'https://techcorp.com',
    industry: 'Technology',
    location: 'San Francisco, CA',
    contactEmail: 'internships@techcorp.com',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'StartupAI',
    description: 'Fast-growing startup building cutting-edge AI applications for business automation.',
    logoUrl: '',
    website: 'https://startupai.com',
    industry: 'Technology',
    location: 'Remote',
    contactEmail: 'careers@startupai.com',
    active: true,
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    return NextResponse.json(internshipCompanies);
  } catch (error) {
    console.error('Error fetching internship companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newCompany = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    internshipCompanies.push(newCompany);
    
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating internship company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    const companyIndex = internshipCompanies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    internshipCompanies[companyIndex] = {
      ...internshipCompanies[companyIndex],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(internshipCompanies[companyIndex]);
  } catch (error) {
    console.error('Error updating internship company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    const companyIndex = internshipCompanies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    internshipCompanies.splice(companyIndex, 1);
    
    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
} 