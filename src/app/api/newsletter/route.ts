import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';



// GET - Get all newsletter subscriptions (admin only)
export async function GET(request: NextRequest) {
  try {
    
    const db = await getDb();
    
    const subscriptions = await db.collection('NewsletterSubscriber')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  } finally {
    
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const { email, name, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    
    const db = await getDb();

    // Check if email already exists
    const existingSubscription = await db.collection('NewsletterSubscriber').findOne({ email });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 });
      } else {
        // Reactivate subscription
        const updateData = {
          isActive: true,
          name: name || existingSubscription.name,
          source: source || existingSubscription.source,
          unsubscribedAt: null,
          updatedAt: new Date()
        };
        
        await db.collection('NewsletterSubscriber').updateOne(
          { email },
          { $set: updateData }
        );
        
        const updated = await db.collection('NewsletterSubscriber').findOne({ email });
        return NextResponse.json({ message: 'Successfully resubscribed!', subscription: updated });
      }
    }

    // Create new subscription
    const subscription = {
      email,
      name,
      source: source || 'website',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('NewsletterSubscriber').insertOne(subscription);

    return NextResponse.json({ message: 'Successfully subscribed!', subscription });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  } finally {
    
  }
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    
    const db = await getDb();

    const updateData = {
      isActive: false,
      unsubscribedAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('NewsletterSubscriber').updateOne(
      { email },
      { $set: updateData }
    );

    const subscription = await db.collection('NewsletterSubscriber').findOne({ email });

    return NextResponse.json({ message: 'Successfully unsubscribed', subscription });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  } finally {
    
  }
} 