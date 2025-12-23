import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get file extension
    const fileExt = path.extname(file.name);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `email-${timestamp}-${randomStr}${fileExt}`;

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'emailUploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    
    await writeFile(filepath, buffer);

    // Return the URL
    const url = `/emailUploads/${filename}`;
    
    console.log(`✅ Uploaded image: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

    return NextResponse.json({ 
      success: true, 
      url,
      fullUrl: `https://abgumich.org${url}`
    });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
