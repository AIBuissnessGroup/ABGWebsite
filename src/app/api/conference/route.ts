import { NextResponse } from 'next/server';
import { getConferenceData } from '@/lib/site-content/conference';

export async function GET() {
  try {
    const data = await getConferenceData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conference data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conference data' },
      { status: 500 }
    );
  }
}
