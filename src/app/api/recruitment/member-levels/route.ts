import { NextResponse } from 'next/server';
import { recruitmentContentStore } from '@/lib/recruitment/content';

export async function GET() {
  return NextResponse.json(recruitmentContentStore.getMemberLevels());
}

