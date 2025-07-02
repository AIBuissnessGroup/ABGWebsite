import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { active: true },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' } as any,
        { joinDate: 'asc' }
      ]
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
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

    const data = await request.json();
    
    // Get the highest sortOrder to add new member at the end
    const maxSortOrder = await prisma.teamMember.findFirst({
      select: { sortOrder: true } as any,
      orderBy: { sortOrder: 'desc' } as any
    });

    const teamMember = await prisma.teamMember.create({
      data: {
        name: data.name,
        role: data.role,
        year: data.year,
        major: data.major || null,
        bio: data.bio || null,
        email: data.email || null,
        linkedIn: data.linkedIn || null,
        github: data.github || null,
        imageUrl: data.imageUrl || null,
        featured: data.featured || false,
        active: true,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1
      } as any
    });

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
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
    
    const teamMember = await prisma.teamMember.update({
      where: { id: data.id },
      data: {
        name: data.name,
        role: data.role,
        year: data.year,
        major: data.major || null,
        bio: data.bio || null,
        email: data.email || null,
        linkedIn: data.linkedIn || null,
        github: data.github || null,
        imageUrl: data.imageUrl || null,
        featured: data.featured || false,
        active: data.active !== undefined ? data.active : true,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : undefined
      } as any
    });

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
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
      return NextResponse.json({ error: 'Team member ID required' }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
} 