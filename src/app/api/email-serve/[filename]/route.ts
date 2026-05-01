/**
 * API route to serve uploaded email image files from GridFS
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getStreamFromGridFSByFilename, nodeToWebStream } from '@/lib/gridfs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Sanitize filename
    const sanitizedFilename = path.basename(filename);
    
    if (sanitizedFilename !== filename || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const file = await getStreamFromGridFSByFilename(sanitizedFilename, 'emailUploads');
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const { stream, contentType, length } = file;
    const webStream = nodeToWebStream(stream);

    // Return file with appropriate headers
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving email image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
