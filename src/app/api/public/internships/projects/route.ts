import { NextResponse } from 'next/server';
import { internshipsStore } from '@/lib/internships/store';

export async function GET() {
  try {
    return NextResponse.json(internshipsStore.getProjects());
  } catch (error) {
    console.error('Error fetching public internship projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
