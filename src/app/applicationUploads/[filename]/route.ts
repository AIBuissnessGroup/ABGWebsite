/**
 * Redirect route for legacy /applicationUploads/* URLs
 * Redirects to the new API file serving endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // Redirect to the API route that serves files
  return NextResponse.redirect(new URL(`/api/file-serve/${filename}`, request.url));
}
