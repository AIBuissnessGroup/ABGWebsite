import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb('abg-website');
    const placements = await db
      .collection('MemberInternship')
      .find({})
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();
    return NextResponse.json(placements);
  } catch (error) {
    console.error('Error fetching member internships (public):', error);
    return NextResponse.json({ error: 'Failed to fetch placements' }, { status: 500 });
  }
}
