import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

// GET - Get all newsletter subscriptions (admin only)
export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db();
    
    const subscriptions = await db.collection('NewsletterSubscriber')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const { email, name, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

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
    await client.close();
  }
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

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
    await client.close();
  }
} 