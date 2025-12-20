import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';

const client = createMongoClient();

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
    
    // Fetch the latest join content from the database
    const joinContent = await db.collection('joinContent').findOne(
      { isActive: true },
      { sort: { updatedAt: -1 } }
    );

    if (!joinContent) {
      // Return default content if none found
      const defaultContent = {
        id: 'default',
        title: 'Join Us',
        description: 'Content not found in database.',
        isActive: true,
        updatedAt: Date.now()
      };
      return NextResponse.json(safeJson(defaultContent));
    }

    return NextResponse.json(safeJson(joinContent));
  } catch (error) {
    console.error('Error fetching join content:', error);
    
    // Return default content on error
    const defaultContent = {
      id: 'default',
      title: 'Join Us',
      description: 'Error loading content.',
      isActive: true,
      updatedAt: Date.now()
    };
    return NextResponse.json(safeJson(defaultContent));
  } finally {
    await client.close();
  }
}
