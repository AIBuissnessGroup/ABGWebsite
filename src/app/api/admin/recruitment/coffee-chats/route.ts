import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Slot = {
  id: string;
  title: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  location: string;
  hostName: string;
  hostEmail: string;
  capacity: number;
  isOpen: boolean;
  signups: Array<{
    id: string;
    userEmail: string;
    userName: string | null;
    createdAt: string;
  }>;
  signupCount: number;
};

export async function GET() {
  try {
    const slots = await prisma.coffeeChatSlot.findMany({
      include: {
        signups: {
          select: {
            id: true,
            userEmail: true,
            userName: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform the data to match the expected format
    const transformedSlots: Slot[] = slots.map(slot => ({
      id: slot.id,
      title: slot.title,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      location: slot.location,
      hostName: slot.hostName,
      hostEmail: slot.hostEmail,
      capacity: slot.capacity,
      isOpen: slot.isOpen,
      signups: slot.signups.map(signup => ({
        id: signup.id,
        userEmail: signup.userEmail,
        userName: signup.userName,
        createdAt: signup.createdAt.toISOString(),
      })),
      signupCount: slot.signups.length,
    }));

    return NextResponse.json(transformedSlots);
  } catch (error) {
    console.error('Error fetching coffee chat slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Creating coffee chat slot with data:', body);
    console.log('User email:', session.user.email);
    console.log('User role:', session.user.role);
    
    const newSlot = await prisma.coffeeChatSlot.create({
      data: {
        title: body.title || 'Coffee Chat',
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location,
        hostName: body.hostName,
        hostEmail: body.hostEmail,
        capacity: Number(body.capacity || 1),
        isOpen: body.isOpen ?? true,
        // createdBy is now optional, so we can skip it for now
      },
      include: {
        signups: {
          select: {
            id: true,
            userEmail: true,
            userName: true,
            createdAt: true,
          },
        },
      },
    });

    console.log('Successfully created slot:', newSlot);

    const transformedSlot: Slot = {
      id: newSlot.id,
      title: newSlot.title,
      startTime: newSlot.startTime.toISOString(),
      endTime: newSlot.endTime.toISOString(),
      location: newSlot.location,
      hostName: newSlot.hostName,
      hostEmail: newSlot.hostEmail,
      capacity: newSlot.capacity,
      isOpen: newSlot.isOpen,
      signups: newSlot.signups.map(signup => ({
        id: signup.id,
        userEmail: signup.userEmail,
        userName: signup.userName,
        createdAt: signup.createdAt.toISOString(),
      })),
      signupCount: newSlot.signups.length,
    };

    return NextResponse.json(transformedSlot);
  } catch (error) {
    console.error('Error creating coffee chat slot:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({ error: 'Failed to create slot', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updatedSlot = await prisma.coffeeChatSlot.update({
      where: { id: body.id },
      data: {
        title: body.title,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        location: body.location,
        hostName: body.hostName,
        hostEmail: body.hostEmail,
        capacity: body.capacity ? Number(body.capacity) : undefined,
        isOpen: body.isOpen,
      },
      include: {
        signups: {
          select: {
            id: true,
            userEmail: true,
            userName: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const transformedSlot: Slot = {
      id: updatedSlot.id,
      title: updatedSlot.title,
      startTime: updatedSlot.startTime.toISOString(),
      endTime: updatedSlot.endTime.toISOString(),
      location: updatedSlot.location,
      hostName: updatedSlot.hostName,
      hostEmail: updatedSlot.hostEmail,
      capacity: updatedSlot.capacity,
      isOpen: updatedSlot.isOpen,
      signups: updatedSlot.signups.map(signup => ({
        id: signup.id,
        userEmail: signup.userEmail,
        userName: signup.userName,
        createdAt: signup.createdAt.toISOString(),
      })),
      signupCount: updatedSlot.signups.length,
    };

    return NextResponse.json(transformedSlot);
  } catch (error) {
    console.error('Error updating coffee chat slot:', error);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, slotId, signupId } = body;

    if (action === 'removeSignup' && slotId && signupId) {
      await prisma.coffeeChatSignup.delete({
        where: { id: signupId },
      });

      // Return updated slot data
      const updatedSlot = await prisma.coffeeChatSlot.findUnique({
        where: { id: slotId },
        include: {
          signups: {
            select: {
              id: true,
              userEmail: true,
              userName: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!updatedSlot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      const transformedSlot: Slot = {
        id: updatedSlot.id,
        title: updatedSlot.title,
        startTime: updatedSlot.startTime.toISOString(),
        endTime: updatedSlot.endTime.toISOString(),
        location: updatedSlot.location,
        hostName: updatedSlot.hostName,
        hostEmail: updatedSlot.hostEmail,
        capacity: updatedSlot.capacity,
        isOpen: updatedSlot.isOpen,
        signups: updatedSlot.signups.map(signup => ({
          id: signup.id,
          userEmail: signup.userEmail,
          userName: signup.userName,
          createdAt: signup.createdAt.toISOString(),
        })),
        signupCount: updatedSlot.signups.length,
      };

      return NextResponse.json(transformedSlot);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error removing signup:', error);
    return NextResponse.json({ error: 'Failed to remove signup' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.coffeeChatSlot.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting coffee chat slot:', error);
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
  }
}


