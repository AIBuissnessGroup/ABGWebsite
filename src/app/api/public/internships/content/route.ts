import { NextResponse } from 'next/server';
import { internshipsStore } from '@/lib/internships/store';

export async function GET() {
  try {
    return NextResponse.json(internshipsStore.getContent());
  } catch (error) {
    console.error('Error fetching public internships content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
