import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

function createMongoClient() {
  return createMongoClient();
}

// Safely serialize MongoDB objects
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// GET - Fetch single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('NewsroomPost');
    
    const { slug } = await params;
    
    const post = await collection.findOne({ 
      slug,
      status: 'published' // Only show published posts to public
    });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    await client.close();
    
    return NextResponse.json(safeJson(post));
    
  } catch (error) {
    console.error('Error fetching post:', error);
    await client.close();
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// POST - Track analytics for post view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const postsCollection = db.collection('NewsroomPost');
    const analyticsCollection = db.collection('NewsroomAnalytics');
    
    const { slug } = await params;
    const body = await request.json();
    
    // Find the post
    const post = await postsCollection.findOne({ slug, status: 'published' });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Get client info
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Create analytics record
    const analyticsRecord = {
      postId: post._id.toString(),
      sessionId: body.sessionId || `${Date.now()}-${Math.random()}`,
      userAgent,
      ipAddress,
      referrer: body.referrer || request.headers.get('referer') || '',
      timeOnPage: body.timeOnPage || 0,
      scrollDepth: body.scrollDepth || 0,
      viewedAt: new Date()
    };
    
    await analyticsCollection.insertOne(analyticsRecord);
    
    // Update post view counts
    const isUniqueView = !(await analyticsCollection.findOne({
      postId: post._id.toString(),
      sessionId: analyticsRecord.sessionId,
      viewedAt: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      }
    }));
    
    await postsCollection.updateOne(
      { _id: post._id },
      {
        $inc: {
          'analytics.views': 1,
          ...(isUniqueView ? { 'analytics.uniqueViews': 1 } : {})
        }
      }
    );
    
    await client.close();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error tracking analytics:', error);
    await client.close();
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}