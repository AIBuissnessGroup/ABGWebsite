import { getDb } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { NewsroomPost, NewsroomFilter } from '@/types/newsroom';



function createMongoClient() {
  return new MongoClient(uri, {
    tls: true,
  });
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Safely serialize MongoDB objects
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// GET - Fetch all posts with filtering and pagination
export async function GET(request: NextRequest) {
  const client = createMongoClient();
  
  try {
    
    const db = await getDb();
    const collection = db.collection('NewsroomPost');
    
    const { searchParams } = new URL(request.url);
    
    // Build filter object
    const filter: any = {};
    
    // Type filter
    const type = searchParams.get('type');
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    // Status filter (default to published for public view)
    const status = searchParams.get('status');
    filter.status = status || 'published';
    
    // Tag filter
    const tag = searchParams.get('tag');
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    
    // Search filter
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Featured filter
    const featured = searchParams.get('featured');
    if (featured === 'true') {
      filter.featured = true;
    }
    
    // Author filter
    const author = searchParams.get('author');
    if (author) {
      filter.author = { $regex: author, $options: 'i' };
    }
    
    // Date range filter
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      filter.datePublished = {};
      if (dateFrom) filter.datePublished.$gte = new Date(dateFrom);
      if (dateTo) filter.datePublished.$lte = new Date(dateTo);
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'datePublished';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: any = {};
    sort[sortBy] = sortOrder;
    
    // Execute queries
    const [posts, totalCount] = await Promise.all([
      collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter)
    ]);
    
    // Get available tags for filtering
    const availableTags = await collection.distinct('tags', { status: 'published' });
    
    
    
    return NextResponse.json(safeJson({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      availableTags: availableTags.sort()
    }));
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}