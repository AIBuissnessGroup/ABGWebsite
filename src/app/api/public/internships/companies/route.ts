import { NextResponse } from 'next/server';
import { internshipsStore } from '@/lib/internships/store';

export async function GET() {
  try {
    return NextResponse.json(internshipsStore.getCompanies());
  } catch (error) {
    console.error('Error fetching public internship companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
