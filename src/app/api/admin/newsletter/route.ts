import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

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
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('NewsletterSubscriber');

    const result = await collection.deleteOne({ id });

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