/**
 * API route to serve uploaded audio recordings
 * This is needed because Next.js standalone build doesn't serve
 * dynamically added files from the public directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// Map file extensions to MIME types for audio
const AUDIO_MIME_TYPES: Record<string, string> = {
  '.webm': 'audio/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    
    if (sanitizedFilename !== filename || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'audioRecordings', sanitizedFilename);
    
    // Check if file exists
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = AUDIO_MIME_TYPES[ext] || 'audio/webm';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
