/**
 * Audio Upload API for Interview Recordings
 * POST - Upload an audio recording for a review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB max for audio recordings

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const applicationId = formData.get('applicationId') as string;
    const phase = formData.get('phase') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!applicationId || !phase) {
      return NextResponse.json({ error: 'applicationId and phase are required' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Validate file type (audio only)
    const validMimeTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a'];
    if (!validMimeTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
      return NextResponse.json({ error: 'Invalid file type. Audio files only.' }, { status: 400 });
    }

    // Create a safe filename
    const reviewerId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    // Get file extension from mime type or fallback to webm
    const mimeToExt: Record<string, string> = {
      'audio/webm': '.webm',
      'audio/mp3': '.mp3',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/mp4': '.m4a',
      'audio/m4a': '.m4a',
    };
    const ext = mimeToExt[file.type] || '.webm';
    const filename = `interview_${applicationId}_${phase}_${reviewerId}_${timestamp}${ext}`;

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'audioRecordings');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    
    await writeFile(filepath, buffer);

    // Return the URL for serving the audio file
    const url = `/audioRecordings/${filename}`;
    
    console.log(`✅ Audio recording uploaded: ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB) by ${session.user.email}`);

    return NextResponse.json({ 
      success: true, 
      url,
      filename,
      size: buffer.length,
    });

  } catch (error: any) {
    console.error('Error uploading audio recording:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload audio' }, { status: 500 });
  }
}
