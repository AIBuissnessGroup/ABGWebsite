import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let heroContent = await prisma.heroContent.findFirst({
      where: { isActive: true }
    });

    // If no content exists, create default content
    if (!heroContent) {
      heroContent = await prisma.heroContent.create({
        data: {}
      });
    }

    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json({ error: 'Failed to fetch hero content' }, { status: 500 });
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
    await prisma.heroContent.updateMany({
      data: { isActive: false }
    });

    // Create or update the hero content
    const heroContent = await prisma.heroContent.upsert({
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

    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json({ error: 'Failed to update hero content' }, { status: 500 });
  }
} 