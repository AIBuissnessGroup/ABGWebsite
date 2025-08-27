import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { MongoClient } from 'mongodb';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    await client.connect();
    const db = client.db('abg-website');
    const collection = db.collection('TeamMember');

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.name || !record.role || !record.year) {
          errors.push(`Missing required fields for record: ${JSON.stringify(record)}`);
          continue;
        }

        const teamMemberData = {
          id: crypto.randomUUID(),
          name: record.name,
          role: record.role,
          year: record.year,
          major: record.major || null,
          bio: record.bio || null,
          email: record.email || null,
          linkedIn: record.linkedIn || null,
          github: record.github || null,
          imageUrl: record.imageUrl || null,
          featured: record.featured === 'true' || false,
          active: record.active !== 'false',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await collection.insertOne(teamMemberData);
        const teamMember = { ...teamMemberData, _id: result.insertedId };

        results.push(teamMember);
      } catch (error: any) {
        errors.push(`Error processing record ${JSON.stringify(record)}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results
    });

  } catch (error: any) {
    console.error('Error importing team members:', error);
    return NextResponse.json({ 
      error: 'Failed to import team members',
      details: error.message 
    }, { status: 500 });
  } finally {
    await client.close();
  }
} 