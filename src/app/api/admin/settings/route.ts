import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { requireAdminSession } from '@/lib/server-admin';

const client = createMongoClient();

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await client.connect();
    const db = client.db();

    const settings = await db.collection('SiteSettings').find({}).sort({ key: 1 }).toArray();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Check if setting exists
    const existingSetting = await db.collection('SiteSettings').findOne({ key });
    
    let setting;
    if (existingSetting) {
      // Update existing
      await db.collection('SiteSettings').updateOne(
        { key },
        { $set: { value, updatedAt: new Date() } }
      );
      setting = await db.collection('SiteSettings').findOne({ key });
    } else {
      // Create new
      const newSetting = { 
        key, 
        value, 
        type: 'TEXT',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('SiteSettings').insertOne(newSetting);
      setting = newSetting;
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating site setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 
