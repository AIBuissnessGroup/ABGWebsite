import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
    let heroContent = await db.collection('HeroContent').findOne({ isActive: true });

    // If no content exists, create default content
    if (!heroContent) {
      const defaultContent = {
        id: 'default-hero',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('HeroContent').insertOne(defaultContent);
      heroContent = defaultContent;
    }

    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json({ error: 'Failed to fetch hero content' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    await client.connect();
    const db = client.db();
    
    // First deactivate all existing content
    await db.collection('HeroContent').updateMany({}, { $set: { isActive: false } });

    // Create or update the hero content
    const updateData = {
      ...data,
      isActive: true,
      updatedAt: new Date()
    };

    let heroContent;
    if (data.id && data.id !== 'new') {
      // Update existing
      await db.collection('HeroContent').updateOne(
        { id: data.id },
        { $set: updateData }
      );
      heroContent = await db.collection('HeroContent').findOne({ id: data.id });
    } else {
      // Create new
      const newContent = {
        ...updateData,
        createdAt: new Date()
      };
      await db.collection('HeroContent').insertOne(newContent);
      heroContent = newContent;
    }

    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json({ error: 'Failed to update hero content' }, { status: 500 });
  } finally {
    await client.close();
  }
} 