import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { MongoClient, ObjectId } from 'mongodb';
import { NewsroomPost } from '@/types/newsroom';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

function createMongoClient() {
  return new MongoClient(uri);
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

// GET - Fetch single post by ID or all posts with filtering and pagination (Admin only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('NewsroomPost');
    
    const { searchParams } = new URL(request.url);
    
    // Check if we're fetching a single post by ID
    const id = searchParams.get('id');
    if (id) {
      const post = await collection.findOne({ _id: new ObjectId(id) });
      await client.close();
      
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      
      return NextResponse.json(safeJson({ post }));
    }
    
    // Build filter object for multiple posts
    const filter: any = {};
    
    // Type filter
    const type = searchParams.get('type');
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    // Status filter (admin can see all statuses)
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      filter.status = status;
    }
    
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
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
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
    const availableTags = await collection.distinct('tags');
    
    await client.close();
    
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
    await client.close();
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - Create new post (Admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('NewsroomPost');
    
    const body = await request.json();
    
    // Validate required fields
    const { title, type, description, body: content } = body;
    
    if (!title || !type || !description || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, type, description, body' 
      }, { status: 400 });
    }
    
    // Generate slug and check for duplicates
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    
    while (await collection.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    const post: Omit<NewsroomPost, '_id'> = {
      title,
      slug,
      type,
      status: body.status || 'draft',
      thumbnail: body.thumbnail || '',
      description,
      body: content,
      mediaEmbedLink: body.mediaEmbedLink || '',
      author: session.user.name || 'Admin',
      authorEmail: session.user.email,
      datePublished: body.status === 'published' ? new Date() : undefined,
      featured: body.featured || false,
      tags: Array.isArray(body.tags) ? body.tags : [],
      seoTitle: body.seoTitle || title,
      seoDescription: body.seoDescription || description,
      openGraphImage: body.openGraphImage || body.thumbnail || '',
      analytics: {
        views: 0,
        uniqueViews: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(post);
    
    await client.close();
    
    return NextResponse.json(safeJson({ 
      _id: result.insertedId,
      ...post 
    }));
    
  } catch (error) {
    console.error('Error creating post:', error);
    await client.close();
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// PUT - Update existing post (Admin only)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('NewsroomPost');
    
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }
    
    // Generate new slug if title changed
    if (updateData.title) {
      const existingPost = await collection.findOne({ _id: new ObjectId(_id) });
      if (!existingPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      
      if (updateData.title !== existingPost.title) {
        let baseSlug = generateSlug(updateData.title);
        let slug = baseSlug;
        let counter = 1;
        
        // Check for slug conflicts (excluding current post)
        while (await collection.findOne({ slug, _id: { $ne: new ObjectId(_id) } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        updateData.slug = slug;
      }
    }
    
    // Set publish date if changing to published
    if (updateData.status === 'published') {
      const existingPost = await collection.findOne({ _id: new ObjectId(_id) });
      if (existingPost?.status !== 'published') {
        updateData.datePublished = new Date();
      }
    }
    
    // Clean up update data
    delete updateData._id;
    updateData.updatedAt = new Date();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const updatedPost = await collection.findOne({ _id: new ObjectId(_id) });
    
    await client.close();
    
    return NextResponse.json(safeJson(updatedPost));
    
  } catch (error) {
    console.error('Error updating post:', error);
    await client.close();
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE - Delete post (Admin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('NewsroomPost');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Also delete related analytics
    await db.collection('NewsroomAnalytics').deleteMany({ postId: id });
    
    await client.close();
    
    return NextResponse.json({ message: 'Post deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    await client.close();
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}