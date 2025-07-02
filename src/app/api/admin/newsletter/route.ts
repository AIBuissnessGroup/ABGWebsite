import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { isAdminEmail } from '@/lib/admin';

const prisma = new PrismaClient();

// GET - Get all newsletter subscriptions with stats
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all subscriptions
    const [subscriptions, totalCount, activeCount, todayCount] = await Promise.all([
      prisma.newsletterSubscription.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.newsletterSubscription.count(),
      prisma.newsletterSubscription.count({
        where: { isActive: true }
      }),
      prisma.newsletterSubscription.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return NextResponse.json({
      subscriptions,
      stats: {
        total: totalCount,
        active: activeCount,
        unsubscribed: totalCount - activeCount,
        todaySignups: todayCount
      }
    });
  } catch (error) {
    console.error('Error fetching newsletter data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete subscription (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    await prisma.newsletterSubscription.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 