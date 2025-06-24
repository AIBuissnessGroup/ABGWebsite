import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    const company = await prisma.company.create({
      data: {
        name: data.name,
        description: data.description || '',
        logoUrl: data.logoUrl || '',
        website: data.website || '',
        industry: data.industry || '',
        size: data.size || '',
        location: data.location || '',
        contactEmail: data.contactEmail || ''
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    const company = await prisma.company.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || '',
        logoUrl: data.logoUrl || '',
        website: data.website || '',
        industry: data.industry || '',
        size: data.size || '',
        location: data.location || '',
        contactEmail: data.contactEmail || ''
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
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
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Check if company has partnerships before deleting
    const partnerships = await prisma.projectPartnership.count({
      where: { companyId: id }
    });

    const eventPartnerships = await prisma.eventPartnership.count({
      where: { companyId: id }
    });

    if (partnerships > 0 || eventPartnerships > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete company with existing partnerships. Remove partnerships first.' 
      }, { status: 400 });
    }

    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
} 