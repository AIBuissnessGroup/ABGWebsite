import { NextResponse } from 'next/server';
import { getConferenceTicketStatus } from '@/lib/conference-pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getConferenceTicketStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching conference pricing:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pricing status' },
      { status: 500 }
    );
  }
}
