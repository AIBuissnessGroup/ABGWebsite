import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let aboutContent = await prisma.aboutContent.findFirst({
      where: { isActive: true }
    });

    // If no content exists, create default content
    if (!aboutContent) {
      aboutContent = await prisma.aboutContent.create({
        data: {}
      });
    }

    return NextResponse.json(aboutContent);
  } catch (error) {
    console.error('Error fetching about content:', error);
    return NextResponse.json({ error: 'Failed to fetch about content' }, { status: 500 });
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
    
    // First deactivate all existing content
    await prisma.aboutContent.updateMany({
      data: { isActive: false }
    });

    // Create or update the about content
    const aboutContent = await prisma.aboutContent.upsert({
      where: { id: data.id || 'new' },
      update: {
        ...data,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        ...data,
        isActive: true
      }
    });

    return NextResponse.json(aboutContent);
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json({ error: 'Failed to update about content' }, { status: 500 });
  }
} 