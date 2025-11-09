import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { isAdmin } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

// GET - Get all newsletter subscriptions with stats
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('NewsletterSubscriber');

    // Get all subscriptions and stats
    const subscriptions = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    const totalCount = await collection.countDocuments();
    const activeCount = await collection.countDocuments({ isActive: true });
    
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayCount = await collection.countDocuments({
      createdAt: { $gte: todayStart }
    });

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
  } finally {
    await client.close();
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
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to get ID from query parameters first, then from request body
    const { searchParams } = new URL(request.url);
    let subscriptionId = searchParams.get('id') || searchParams.get('_id');
    
    if (!subscriptionId) {
      try {
        const body = await request.json();
        subscriptionId = body.id || body._id || body.subscriptionId;
      } catch (error) {
        // If JSON parsing fails, continue without body data
      }
    }

    if (!subscriptionId) {
      return NextResponse.json({ 
        error: 'Subscription ID is required',
        details: 'Please provide the subscription ID in query parameters (?id=...) or request body'
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('NewsletterSubscriber');

    // Try to delete by _id (ObjectId) first, then by id field if it exists
    let result;
    try {
      result = await collection.deleteOne({ _id: new ObjectId(subscriptionId) });
    } catch (error) {
      // If ObjectId conversion fails, try as string id
      result = await collection.deleteOne({ id: subscriptionId });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 