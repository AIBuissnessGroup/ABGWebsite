import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

export async function GET() {
  try {
    await client.connect();
    const db = client.db('abg-website');
    
    // Fetch the latest about content from the database
    const aboutContent = await db.collection('AboutContent').findOne(
      { isActive: true },
      { sort: { updatedAt: -1 } }
    );

    if (!aboutContent) {
      // Return default content if none found
      const defaultContent = {
        id: 'default',
        title: 'About Us',
        description: 'Content not found in database.',
        isActive: true,
        updatedAt: Date.now()
      };
      return NextResponse.json(safeJson(defaultContent));
    }

    return NextResponse.json(safeJson(aboutContent));
  } catch (error) {
    console.error('Error fetching about content:', error);
    
    // Return default content on error
    const defaultContent = {
      id: 'default',
      title: 'About Us',
      description: 'Error loading content.',
      isActive: true,
      updatedAt: Date.now()
    };
    return NextResponse.json(safeJson(defaultContent));
  } finally {
    await client.close();
  }
}
