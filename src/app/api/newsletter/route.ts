import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all newsletter subscriptions (admin only)
export async function GET(request: NextRequest) {
  try {
    const subscriptions = await prisma.newsletterSubscription.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const { email, name, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email already exists
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 });
      } else {
        // Reactivate subscription
        const updated = await prisma.newsletterSubscription.update({
          where: { email },
          data: {
            isActive: true,
            name: name || existingSubscription.name,
            source: source || existingSubscription.source,
            unsubscribedAt: null,
            updatedAt: new Date()
          }
        });
        return NextResponse.json({ message: 'Successfully resubscribed!', subscription: updated });
      }
    }

    // Create new subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email,
        name,
        source: source || 'website'
      }
    });

    return NextResponse.json({ message: 'Successfully subscribed!', subscription });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const subscription = await prisma.newsletterSubscription.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Successfully unsubscribed', subscription });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
} 