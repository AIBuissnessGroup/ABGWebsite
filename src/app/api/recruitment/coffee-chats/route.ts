import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Public GET uses the same source as admin
export async function GET() {
  try {
    const slots = await prisma.coffeeChatSlot.findMany({
      where: {
        isOpen: true, // Only show open slots to public
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
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform the data to match the expected format
    const transformedSlots = slots.map(slot => ({
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

// Signup for a slot (UMich email required)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slotId } = body;
    if (!slotId) return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });

    // Check if slot exists and is open
    const slot = await prisma.coffeeChatSlot.findUnique({
      where: { id: slotId },
      include: {
        signups: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (!slot.isOpen) {
      return NextResponse.json({ error: 'Slot is closed for signups' }, { status: 400 });
    }

    // Check if user is already signed up
    const existingSignup = await prisma.coffeeChatSignup.findFirst({
      where: {
        slotId,
        userEmail: session.user.email,
      },
    });

    if (existingSignup) {
      return NextResponse.json({ error: 'You are already signed up for this slot' }, { status: 400 });
    }

    // Check if slot is full
    if (slot.signups.length >= slot.capacity) {
      return NextResponse.json({ error: 'Slot is full' }, { status: 400 });
    }

    // Create the signup
    const signup = await prisma.coffeeChatSignup.create({
      data: {
        slotId,
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name || null,
      },
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Successfully signed up for coffee chat',
      signupId: signup.id 
    });
  } catch (error) {
    console.error('Error signing up for coffee chat:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}

// Remove signup from a slot (UMich email required)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user.email.endsWith('@umich.edu')) {
    return NextResponse.json({ error: 'UMich login required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');
    
    if (!slotId) {
      return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
    }

    // Check if slot exists
    const slot = await prisma.coffeeChatSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Find the user's signup
    const signup = await prisma.coffeeChatSignup.findFirst({
      where: {
        slotId,
        userEmail: session.user.email,
      },
    });

    if (!signup) {
      return NextResponse.json({ error: 'You are not signed up for this slot' }, { status: 404 });
    }

    // Delete the signup
    await prisma.coffeeChatSignup.delete({
      where: { id: signup.id },
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Successfully removed from coffee chat slot'
    });
  } catch (error) {
    console.error('Error removing signup from coffee chat:', error);
    return NextResponse.json({ error: 'Failed to remove signup' }, { status: 500 });
  }
}


