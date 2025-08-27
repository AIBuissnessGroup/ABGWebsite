import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
    let aboutContent = await db.collection('AboutContent').findOne({ isActive: true });

    // If no content exists, create default content
    if (!aboutContent) {
      const defaultContent = {
        id: 'default-about-content',
        carouselSlides: '[]',
        collaborationDisplayMode: 'carousel',
        collaborationSubtitle: 'Default subtitle',
        collaborationTitle: 'Default title',
        description1: 'Default description 1',
        description2: 'Default description 2',
        isActive: true,
        mainTitle: 'About Us',
        membersCount: '0',
        missionCount: '0',
        partnersCount: '0',
        primaryButtonLink: '/',
        primaryButtonText: 'Learn More',
        projectsCount: '0',
        secondaryButtonLink: '/',
        secondaryButtonText: 'Join Us',
        subtitle: 'Default subtitle',
        title: 'Default title',
        updatedAt: new Date(),
        value1Desc: 'Default value 1 description',
        value1Icon: 'default-icon',
        value1Title: 'Value 1',
        value2Desc: 'Default value 2 description',
        value2Icon: 'default-icon',
        value2Title: 'Value 2',
        value3Desc: 'Default value 3 description',
        value3Icon: 'default-icon',
        value3Title: 'Value 3',
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
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    await client.connect();
    const db = client.db();
    
    // First deactivate all existing content
    await db.collection('AboutContent').updateMany({}, { $set: { isActive: false } });

    // Create or update the about content
    const updateData = {
      ...data,
      isActive: true,
      updatedAt: new Date()
    };

    let aboutContent;
    if (data.id && data.id !== 'new') {
      // Update existing
      await db.collection('AboutContent').updateOne(
        { id: data.id },
        { $set: updateData }
      );
      aboutContent = await db.collection('AboutContent').findOne({ id: data.id });
    } else {
      // Create new
      const newContent = {
        ...updateData,
        createdAt: new Date()
      };
      await db.collection('AboutContent').insertOne(newContent);
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