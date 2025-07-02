import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

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

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.name || !record.role || !record.year) {
          errors.push(`Missing required fields for record: ${JSON.stringify(record)}`);
          continue;
        }

        const teamMember = await prisma.teamMember.create({
          data: {
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
            active: record.active !== 'false'
          }
        });

        results.push(teamMember);
      } catch (error) {
        errors.push(`Error processing record ${JSON.stringify(record)}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results
    });

  } catch (error) {
    console.error('Error importing team members:', error);
    return NextResponse.json({ 
      error: 'Failed to import team members',
      details: error.message
    }, { status: 500 });
  }
} 