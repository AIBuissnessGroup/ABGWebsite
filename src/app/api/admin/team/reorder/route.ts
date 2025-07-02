import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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

    const { items } = await request.json();
    
    // Update sort order for all team members
    const updatePromises = items.map((item: { id: string; sortOrder: number }) =>
      prisma.teamMember.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder } as any
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering team members:', error);
    return NextResponse.json({ error: 'Failed to reorder team members' }, { status: 500 });
  }
} 