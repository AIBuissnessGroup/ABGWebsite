import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { MongoClient } from 'mongodb';
import { NewsroomStats } from '@/types/newsroom';

function createMongoClient() {
  return createMongoClient();
}

// Safely serialize MongoDB objects
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// GET - Fetch newsroom analytics (Admin only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const postsCollection = db.collection('NewsroomPost');
    const analyticsCollection = db.collection('NewsroomAnalytics');
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Get basic stats
    const [totalPosts, publishedPosts] = await Promise.all([
      postsCollection.countDocuments(),
      postsCollection.countDocuments({ status: 'published' })
    ]);
    
    // Get total views and unique views
    const [totalViews, uniqueViews] = await Promise.all([
      analyticsCollection.countDocuments({ viewedAt: { $gte: dateFrom } }),
      analyticsCollection.aggregate([
        { $match: { viewedAt: { $gte: dateFrom } } },
        { $group: { _id: '$sessionId' } },
        { $count: 'uniqueViews' }
      ]).toArray()
    ]);
    
    const totalUniqueViews = uniqueViews[0]?.uniqueViews || 0;
    
    // Calculate average time on page
    const avgTimeResult = await analyticsCollection.aggregate([
      { 
        $match: { 
          viewedAt: { $gte: dateFrom },
          timeOnPage: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$timeOnPage' }
        }
      }
    ]).toArray();
    
    const averageTimeOnPage = avgTimeResult[0]?.averageTime || 0;
    
    // Get top performing posts
    const topPosts = await postsCollection.find(
      { status: 'published' },
      { 
        projection: { 
          title: 1, 
          'analytics.views': 1, 
          'analytics.uniqueViews': 1,
          slug: 1
        }
      }
    )
    .sort({ 'analytics.views': -1 })
    .limit(10)
    .toArray();
    
    // Get posts by type
    const postsByType = await postsCollection.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]).toArray();
    
    const postsByTypeMap = postsByType.reduce((acc: Record<string, number>, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    // Get views over time (daily for the specified period)
    const viewsOverTime = await analyticsCollection.aggregate([
      { $match: { viewedAt: { $gte: dateFrom } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' }
          },
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          date: '$_id',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();
    
    const stats: NewsroomStats = {
      totalPosts: publishedPosts,
      totalViews,
      totalUniqueViews,
      averageTimeOnPage: Math.round(averageTimeOnPage),
      topPosts: topPosts.map(post => ({
        _id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        views: post.analytics?.views || 0,
        uniqueViews: post.analytics?.uniqueViews || 0
      })),
      postsByType: postsByTypeMap,
      viewsOverTime: viewsOverTime.map(item => ({
        date: item.date,
        views: item.views,
        uniqueViews: item.uniqueViews
      }))
    };
    
    await client.close();
    
    return NextResponse.json(safeJson(stats));
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    await client.close();
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}