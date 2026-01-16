/**
 * Portal Application File Upload API
 * POST - Upload a file for an application (resume, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Common file types for display purposes only (no validation)
const COMMON_FILE_EXTENSIONS: Record<string, string[]> = {
  resume: ['.pdf', '.doc', '.docx'],
  transcript: ['.pdf'],
  portfolio: ['.pdf', '.zip', '.pptx', '.png', '.jpg'],
  headshot: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  other: ['All file types accepted'],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// Helper to get suggested extensions for UI display
export function getSuggestedExtensions(fileType: string): string {
  const extensions = COMMON_FILE_EXTENSIONS[fileType] || COMMON_FILE_EXTENSIONS.other;
  return extensions.join(', ');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;
    const fileType = formData.get('fileType') as string || 'other';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!key) {
      return NextResponse.json({ error: 'No field key provided' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // No file type validation - accept all file types

    // Create a safe filename
    const userId = session.user.id || session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    const fileExt = path.extname(file.name);
    const timestamp = Date.now();
    const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${userId}_${safeKey}_${timestamp}${fileExt}`;

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'applicationUploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    
    await writeFile(filepath, buffer);

    // Return the API URL for serving the file (Next.js doesn't serve dynamically uploaded files)
    const url = `/api/file-serve/${filename}`;
    const suggestedExtensions = getSuggestedExtensions(fileType);
    
    console.log(`✅ Portal file uploaded: ${filename} (${(buffer.length / 1024).toFixed(2)} KB) for user ${session.user.email}`);

    return NextResponse.json({ 
      success: true, 
      url,
      filename: file.name,
      key,
      suggestedExtensions,
    });

  } catch (error: any) {
    console.error('Error uploading application file:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
