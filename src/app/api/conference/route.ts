import { NextResponse } from 'next/server';
import { getConferenceData } from '@/lib/site-content/conference';

export async function GET() {
  try {
    // Access lists (check-in staff, stage controllers) are internal; keep them out of the public payload
    const data = { ...(await getConferenceData()) };
    delete data.checkinStaff;
    delete data.stageControllers;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conference data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conference data' },
      { status: 500 }
    );
  }
}
