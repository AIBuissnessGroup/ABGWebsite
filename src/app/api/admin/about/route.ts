import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
    // First try to find actual about content (not default)
    let aboutContent = await db.collection('AboutContent').findOne({ 
      title: { $exists: true, $ne: 'Default title' }
    });

    // If no real content exists, find any active content
    if (!aboutContent) {
      aboutContent = await db.collection('AboutContent').findOne({ isActive: true });
    }

    // If still no content exists, create default content
    if (!aboutContent) {
      const defaultContent = {
        id: 'default-about-content',
        carouselSlides: '[]',
        collaborationDisplayMode: 'carousel',
        collaborationSubtitle: 'Building partnerships that matter',
        collaborationTitle: 'OUR COLLABORATIONS',
        description1: 'AI Business Group brings together builders, entrepreneurs, and innovators at the University of Michigan.',
        description2: 'We create innovative solutions that prepare students to lead in an AI-driven world.',
        isActive: true,
        mainTitle: 'BUILDING THE FUTURE',
        membersCount: '50',
        missionCount: '1',
        partnersCount: '10',
        primaryButtonLink: '/projects',
        primaryButtonText: 'See Our Work',
        projectsCount: '12',
        secondaryButtonLink: '/team',
        secondaryButtonText: 'Meet The Team',
        subtitle: 'AI SHAPES TOMORROW',
        title: 'WHO WE ARE',
        updatedAt: new Date(),
        value1Desc: 'Innovation through collaboration',
        value1Icon: 'lightbulb',
        value1Title: 'Innovation',
        value2Desc: 'Building real-world solutions',
        value2Icon: 'gear',
        value2Title: 'Impact',
        value3Desc: 'Preparing future leaders',
        value3Icon: 'users',
        value3Title: 'Growth',
        createdAt: new Date()
      };
      
      await db.collection('AboutContent').insertOne(defaultContent);
      aboutContent = defaultContent;
    }

    // Safely serialize BigInt values
    function safeJson(obj: any) {
      return JSON.parse(JSON.stringify(obj, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v
      ));
    }
    return NextResponse.json(safeJson(aboutContent));
  } catch (error) {
    console.error('Error fetching about content:', error);
    return NextResponse.json({ error: 'Failed to fetch about content' }, { status: 500 });
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
    
    // First, find the existing about content (the one with actual content)
    let existingAbout = await db.collection('AboutContent').findOne({ 
      title: { $exists: true, $ne: 'Default title' }
    });
    
    // Create or update the about content
    const updateData = {
      ...data,
      isActive: true,
      updatedAt: new Date()
    };

    let aboutContent;
    if (existingAbout) {
      // Update the existing about content
      await db.collection('AboutContent').updateOne(
        { _id: existingAbout._id },
        { $set: updateData }
      );
      // Set all other content to inactive
      await db.collection('AboutContent').updateMany(
        { _id: { $ne: existingAbout._id } }, 
        { $set: { isActive: false } }
      );
      aboutContent = await db.collection('AboutContent').findOne({ _id: existingAbout._id });
    } else {
      // Create new content
      const newContent = {
        ...updateData,
        createdAt: new Date()
      };
      await db.collection('AboutContent').insertOne(newContent);
      // Set all other content to inactive
      await db.collection('AboutContent').updateMany(
        { _id: { $ne: newContent._id } }, 
        { $set: { isActive: false } }
      );
      aboutContent = newContent;
    }

    // Safely serialize BigInt values
    function safeJson(obj: any) {
      return JSON.parse(JSON.stringify(obj, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v
      ));
    }
    return NextResponse.json(safeJson(aboutContent));
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json({ error: 'Failed to update about content' }, { status: 500 });
  } finally {
    await client.close();
  }
} 