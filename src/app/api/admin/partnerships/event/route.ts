import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const { eventId, partnerships } = await request.json();

    // Delete existing partnerships for this event
    await prisma.eventPartnership.deleteMany({
      where: { eventId }
    });

    // Create new partnerships
    if (partnerships && partnerships.length > 0) {
      await prisma.eventPartnership.createMany({
        data: partnerships.map((p: any) => ({
          eventId,
          companyId: p.companyId,
          type: p.type,
          description: p.description || '',
          sponsorshipLevel: p.sponsorshipLevel || null
        }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing event partnerships:', error);
    return NextResponse.json({ error: 'Failed to manage partnerships' }, { status: 500 });
  }
} 