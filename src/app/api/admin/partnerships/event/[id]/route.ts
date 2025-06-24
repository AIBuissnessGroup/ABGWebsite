import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const eventId = id;

    const partnerships = await prisma.eventPartnership.findMany({
      where: { eventId },
      include: {
        company: true
      }
    });

    return NextResponse.json(partnerships);
  } catch (error) {
    console.error('Error fetching event partnerships:', error);
    return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
  }
} 