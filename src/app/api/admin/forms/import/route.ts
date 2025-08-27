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

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    const results: any[] = [];
    const errors: string[] = [];

    for (const record of records) {
      try {
        const title = record.title?.toString().trim();
        const description = record.description?.toString() || '';
        const category = (record.category?.toString() || 'general');
        const isActive = (record.isActive?.toString().toLowerCase() !== 'false');
        const isPublic = (record.isPublic?.toString().toLowerCase() !== 'false');
        const allowMultiple = (record.allowMultiple?.toString().toLowerCase() === 'true');
        const requireAuth = (record.requireAuth?.toString().toLowerCase() === 'true');
        const notifyOnSubmission = (record.notifyOnSubmission?.toString().toLowerCase() !== 'false');
        const notificationEmail = record.notificationEmail?.toString() || null;
        const backgroundColor = record.backgroundColor?.toString() || '#00274c';
        const textColor = record.textColor?.toString() || '#ffffff';
        const deadline = record.deadline ? new Date(record.deadline) : null;
        const maxSubmissions = record.maxSubmissions ? parseInt(record.maxSubmissions) : null;

        if (!title) {
          errors.push(`Missing title for record: ${JSON.stringify(record)}`);
          continue;
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const exists = await prisma.form.findUnique({ where: { slug } });
        if (exists) {
          results.push({ slug, skipped: true, reason: 'exists' });
          continue;
        }

        const form = await prisma.form.create({
          data: {
            title,
            description,
            slug,
            category,
            isActive,
            isPublic,
            allowMultiple,
            deadline: deadline || undefined,
            maxSubmissions: maxSubmissions || undefined,
            notifyOnSubmission,
            notificationEmail,
            requireAuth,
            backgroundColor,
            textColor,
            createdBy: user.id,
          }
        });

        results.push({ slug: form.slug, id: form.id });
      } catch (e: any) {
        errors.push(`Error processing record ${JSON.stringify(record)}: ${e.message}`);
      }
    }

    return NextResponse.json({ success: true, imported: results.length, results, errors: errors.length ? errors : undefined });
  } catch (error: any) {
    console.error('Error importing forms:', error);
    return NextResponse.json({ error: 'Failed to import forms', details: error.message }, { status: 500 });
  }
}


