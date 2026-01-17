import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/rewind-images - Returns list of all images in /public/images/rewind/
export async function GET() {
  try {
    const rewindDir = path.join(process.cwd(), 'public', 'images', 'rewind');
    
    // Check if directory exists
    if (!fs.existsSync(rewindDir)) {
      return NextResponse.json({ images: [] });
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(rewindDir);
    
    // Filter for image files only
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => `/images/rewind/${file}`);
    
    return NextResponse.json({ 
      images,
      count: images.length,
      // In dev mode, add cache-busting timestamp
      timestamp: process.env.NODE_ENV === 'development' ? Date.now() : undefined
    });
  } catch (error) {
    console.error('Error reading rewind images:', error);
    return NextResponse.json({ images: [], error: 'Failed to read images' }, { status: 500 });
  }
}
