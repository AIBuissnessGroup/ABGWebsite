import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
    // First try to find actual hero content (not just default)
    let heroContent = await db.collection('HeroContent').findOne({ 
      mainTitle: { $exists: true } 
    });

    // If no real content exists, find any active content
    if (!heroContent) {
      heroContent = await db.collection('HeroContent').findOne({ isActive: true });
    }

    // If still no content exists, create default content with all fields
    if (!heroContent) {
      const defaultContent = {
        id: 'default-hero',
        mainTitle: "AI SHAPES",
        subTitle: "TOMORROW.",
        thirdTitle: "WE MAKE AI",
        description: "One project at a time. We're building the bridge between artificial intelligence and real-world business impact at the University of Michigan.",
        primaryButtonText: "See What's Possible",
        primaryButtonLink: "#join",
        secondaryButtonText: "Explore Projects",
        secondaryButtonLink: "/projects",
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
    const session = await getServerSession(authOptions);
    
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
    
    // First, find the existing hero content (the one with actual content)
    let existingHero = await db.collection('HeroContent').findOne({ 
      mainTitle: { $exists: true } 
    });
    
    // Create or update the hero content
    const updateData = {
      ...data,
      isActive: true,
      updatedAt: new Date()
    };

    let heroContent;
    if (existingHero) {
      // Update the existing hero content
      await db.collection('HeroContent').updateOne(
        { _id: existingHero._id },
        { $set: updateData }
      );
      // Set all other content to inactive
      await db.collection('HeroContent').updateMany(
        { _id: { $ne: existingHero._id } }, 
        { $set: { isActive: false } }
      );
      heroContent = await db.collection('HeroContent').findOne({ _id: existingHero._id });
    } else {
      // Create new content
      const newContent = {
        ...updateData,
        createdAt: new Date()
      };
      const insertResult = await db.collection('HeroContent').insertOne(newContent);
      // Set all other content to inactive
      await db.collection('HeroContent').updateMany(
        { _id: { $ne: insertResult.insertedId } }, 
        { $set: { isActive: false } }
      );
      heroContent = newContent;
    }

    console.log('Final hero content:', heroContent);
    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json({ error: 'Failed to update hero content' }, { status: 500 });
  } finally {
    await client.close();
  }
} 